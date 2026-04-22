from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse, Response
from sqlalchemy.orm import Session
import asyncio
from datetime import datetime, timedelta
import random
import httpx
import urllib.parse
import hashlib
from app.core.config import ENABLE_CHALLENGE, BASE_URL
from app.database import get_db
from app.models import campaign, user
from app.models.campaign import Campaign
from app.models.offer import Offer
from app.models.blocked_ip import BlockedIP
from fastapi.responses import StreamingResponse
from app.models.click_log import ClickLog
from app.models.raw_hit_log import RawHitLog
from app.services.bot_classifier import BotClassifier
from app.services.plan_limits import check_click_limit
from app.services.super_rewrite import rewrite_all
from app.models.subscription import Subscription
from app.routers.challenge import get_real_ip
from app.services.visitor_context import VisitorContext
from app.services.rule_engine import RuleEngine
from app.services.rotation import choose_offer_for_rule, choose_offer_for_campaign
from app.services.routing_engine import RoutingEngine
from app.services.analytics import update_daily_stats
from app.services.risk_engine import RiskEngine
from app.services.rewrite_engine import RewriteEngine
from app.services.traffic_filter_service import check_traffic_filters
from app.services.realtime_service import broadcast
from app.services.ip_reputation import increase_ip_risk
from app.services.learning_engine import (
    update_campaign_learning,
    update_source_learning,
)

from app.services.token_service import (
    generate_secure_token,
    decode_secure_token,
    is_token_used,
    mark_token_used,
)

from app.services.rate_limiter import check_rate_limit
from app.services.redis_client import redis_client
from app.services.session_engine import evaluate_session

router = APIRouter(tags=["Redirect"])
from fastapi.responses import HTMLResponse


def smart_redirect(url: str):
    return HTMLResponse(
        f"""
    <html>
      <head>
        <meta name="referrer" content="unsafe-url">
        <meta http-equiv="refresh" content="0; url={url}">
        <script>
          window.location.href = "{url}";
        </script>
      </head>
    </html>
    """
    )


def set_decision(current, new):
    if current == "blocked":
        return current
    return new


def append_click_id(url, click_id):
    return url  # 🔥 DISABLED (NO URL TRACKING)


def compute_final_decision(visitor, risk_score):
    """
    SAFE decision layer
    No breaking changes
    """

    try:
        bot_score = getattr(visitor, "bot_score", 0)

        final_score = (risk_score * 0.7) + (bot_score * 0.3)

        # 🔥 HARD BLOCK
        if final_score >= 85:
            return "blocked", final_score

        # 🔥 CHALLENGE ZONE
        if final_score >= 55:
            return "challenge", final_score

        return "allow", final_score

    except Exception:
        return "allow", 0


# =====================================================
# SAFE PAGE
# =====================================================


@router.get("/safe/{slug}")
async def safe_redirect(slug: str):
    return RedirectResponse("/")


# =====================================================
# RAW HIT LOGGING
# =====================================================


def log_raw_hit(visitor: VisitorContext, request: Request, db: Session):

    try:

        log = RawHitLog(
            ip=visitor.ip,
            user_agent=visitor.user_agent_string,
            path=str(request.url),
            country=visitor.country,
            region=visitor.region,
            city=visitor.city,
            browser=visitor.browser,
            os=visitor.os,
            device_type=visitor.device_type,
            traffic_source=visitor.traffic_source,
            traffic_medium=visitor.traffic_medium,
            ip_type=visitor.ip_type,
            connection_type=visitor.connection_type,
            asn=visitor.asn,
            org=visitor.org,
            bot_score=visitor.bot_score,
            is_bot=str(visitor.is_bot),
            created_at=datetime.utcnow(),
        )

        db.add(log)
        db.commit()

    except Exception:
        db.rollback()


# =====================================================
# MAIN REDIRECT ROUTE
# =====================================================


@router.get("/r/{slug}")
@router.get("/r/{slug}/{token}")
async def redirect_campaign(
    slug: str,
    request: Request,
    token: str | None = None,
    db: Session = Depends(get_db),
):
    # is_duplicate = False

    visitor = VisitorContext(request)

    # ✅ DEBUG + FIX (yahi jagah correct hai)
    print("🔥 HEADER REFERER:", request.headers.get("referer"))
    print("🔥 SAVED REF:", visitor.referrer)
    # ✅ FIX: Capture real referrer
    # 🔥 ALWAYS CAPTURE FIRST HIT
    raw_ref = (
        request.headers.get("referer")
        or request.headers.get("origin")
        or request.query_params.get("ref")
    )

    # 🔥 IF EMPTY → DON'T FORCE "-"
    if raw_ref:
        visitor.referrer = raw_ref
    else:
        visitor.referrer = None  # 🔥 important change

    # =========================
    # 🔥 JS SIGNALS (HYBRID)
    # =========================
    js_fp = request.headers.get("x-ti-fp")
    js_cpu = request.headers.get("x-ti-cpu")
    js_screen = request.headers.get("x-ti-screen")

    if js_fp:
        visitor.js_fingerprint = js_fp

    if js_cpu:
        try:
            visitor.js_cpu = int(js_cpu)
        except:
            visitor.js_cpu = 0

    if js_screen:
        visitor.js_screen = js_screen

    # =========================
    # 🔥 CLEAN IP (FINAL FIX)
    # =========================
    forwarded_for = request.headers.get("x-forwarded-for")
    cf_ip = request.headers.get("cf-connecting-ip")

    if forwarded_for:
        ip = forwarded_for.split(",")[0].strip()  # ✅ REAL USER IP
    elif cf_ip:
        ip = cf_ip
    else:
        ip = visitor.ip
    print("🔥 XFF:", forwarded_for)
    print("🔥 CF-IP:", cf_ip)
    print("🔥 FINAL IP:", ip)

    print("🔥 Clean IP:", ip)
    # 🔥 DEFINE REAL NAVIGATION (FIX)
    sec_fetch = request.headers.get("sec-fetch-dest", "")
    sec_mode = request.headers.get("sec-fetch-mode", "")

    is_real_navigation = request.method == "GET" and not request.headers.get(
        "x-requested-with"
    )

    is_bot_traffic = (
        visitor.is_bot or visitor.bot_score >= 80 or visitor.device_type == "bot"
    )

    # =========================
    # 🔥 ONLY MAIN PAGE (IMPORTANT FIX)
    # =========================
    sec_fetch = request.headers.get("sec-fetch-dest", "")

    # is_main_request = sec_fetch == "document" or sec_fetch == ""

    # =========================
    # 🔥 EARLY PASS CHECK
    # =========================
    challenge_pass = False

    if is_real_navigation:
        if redis_client.get(f"challenge_pass:{ip}"):
            print("✅ CHALLENGE ALREADY PASSED")
            challenge_pass = True

    # ✅ PEHLE campaign load karo
    campaign = (
        db.query(Campaign)
        .filter(
            Campaign.slug == slug,
            Campaign.is_deleted == False,
        )
        .first()
    )
    # 🔥 BLOCK CHECK (EARLY EXIT - CRITICAL)
    is_blocked_final = False  # ✅ yaha add karo
    blocked = db.query(BlockedIP).filter(BlockedIP.ip_address == ip).first()

    # 🔥 BOT FIRST (TOP PRIORITY)
    # is_bot_traffic = (
    #     visitor.is_bot or visitor.bot_score >= 80 or visitor.device_type == "bot"
    # )

    # if is_bot_traffic:
    #     print("🤖 BOT → DECOY")
    #     return RedirectResponse(campaign.bot_url or "/decoy")

    # 🔥 BLOCKED IP
    if blocked:
        print("🚫 BLOCKED IP HIT:", ip)
        return RedirectResponse(campaign.safe_page_url or "/decoy")

    # campaign = (
    #     db.query(Campaign)
    #     .filter(
    #         Campaign.slug == slug,
    #         Campaign.is_deleted == False,
    #     )
    #     .first()
    # )

    if not campaign:
        return RedirectResponse("/decoy")

    # 🔥 SUBSCRIPTION CHECK (FINAL FIX)

    subscription_active = True

    sub = (
        db.query(Subscription)
        .filter(Subscription.user_id == campaign.user_id)
        .order_by(Subscription.expire_date.desc())
        .first()
    )

    # 🔍 DEBUG (temporary)
    print("SUB STATUS:", sub.status if sub else None)
    print("SUB EXPIRE:", sub.expire_date if sub else None)
    print("NOW UTC:", datetime.utcnow())
    print("USER ID:", campaign.user_id)

    # ❌ NO SUBSCRIPTION → BLOCK
    if not sub:
        print("⛔ NO SUBSCRIPTION FOUND")

        subscription_active = False
        is_blocked_final = True

    # 🔴 EXPIRED BY STATUS
    elif sub.status == "expired":
        print("⛔ SUBSCRIPTION EXPIRED (STATUS)")

        subscription_active = False
        is_blocked_final = True

    # 🟡 EXPIRED BY DATE (SAFE CHECK)
    elif sub.expire_date and sub.expire_date < datetime.utcnow():
        print("⛔ SUBSCRIPTION EXPIRED (DATE)")

        sub.status = "expired"
        db.commit()

        subscription_active = False
        is_blocked_final = True

    # 🔥 FINAL BLOCK ACTION
    if not subscription_active:
        decision = "blocked"
        reason = "subscription_expired"

        redirect_url = campaign.safe_page_url or "/decoy"
        destination_url = redirect_url

    # 🔥 ONLY RUN CLOAKER ON MAIN NAVIGATION
    sec_fetch = request.headers.get("sec-fetch-dest", "")

    ENABLE_CHALLENGE_LOCAL = ENABLE_CHALLENGE  # default

    if sec_fetch and sec_fetch not in ["document", "navigate"]:
        print("⚡ SKIP NON DOCUMENT:", sec_fetch)
        ENABLE_CHALLENGE_LOCAL = False

    # 🔥 SKIP AJAX
    if request.headers.get("x-requested-with") == "XMLHttpRequest":
        print("⚡ AJAX SKIP")
        ENABLE_CHALLENGE_LOCAL = False

    # 🔥 REFERER BASED SKIP
    referer = request.headers.get("referer", "")

    if "/r/" in referer:
        print("⚡ INTERNAL REQUEST SKIP")
        ENABLE_CHALLENGE_LOCAL = False

    # -------------------------------------------------
    # CHALLENGE CHECK (MOVE HERE - EARLY)
    # -------------------------------------------------

    try:
        challenge_pass = bool(redis_client.get(f"challenge_pass:{ip}"))
    except Exception:
        challenge_pass = None
    print("IP:", ip)
    try:
        val = redis_client.get(f"challenge_pass:{ip}")
        print("CHALLENGE KEY:", val)
    except Exception as e:
        print("REDIS ERROR:", e)
        val = None

    if (
        ENABLE_CHALLENGE_LOCAL
        and not challenge_pass
        and not is_bot_traffic
        and (
            visitor.bot_score >= 30
            or visitor.connection_type in ["vpn", "datacenter"]
            or visitor.is_bot
        )
    ):
        # 🔥 SKIP AJAX / FETCH CALLS
        if request.headers.get("x-requested-with") == "XMLHttpRequest":
            print("⚡ AJAX SKIP")
            ENABLE_CHALLENGE_LOCAL = False

        # 🔥 Only suspicious traffic
        if visitor.bot_score >= 30 or visitor.connection_type in ["vpn", "datacenter"]:

            # 🔥 CALCULATE RISK FIRST
            try:
                risk_engine = RiskEngine(visitor, campaign)
                risk_score = risk_engine.calculate()

            except Exception:
                risk_score = visitor.bot_score

            # 🔥 LOG CHALLENGE HIT
            try:
                click = ClickLog(
                    campaign_id=campaign.id,
                    user_id=campaign.user_id,
                    ip_address=ip,
                    country=visitor.country,
                    user_agent=visitor.user_agent_string,
                    browser=visitor.browser,
                    os=visitor.os,
                    device_type=visitor.device_type,
                    bot_score=visitor.bot_score,
                    is_bot=visitor.is_bot,
                    risk_score=risk_score,
                    fingerprint="challenge",
                    status="blocked",
                    reason="challenge_failed",
                    destination="/challenge",
                )

                db.add(click)
                db.commit()

            except Exception:
                db.rollback()

            # 🔥 REDIRECT TO CHALLENGE
            redirect_url = f"/challenge/{slug}"
            destination_url = redirect_url
            decision = "blocked"
            reason = "challenge_redirect"
            return RedirectResponse(redirect_url)

    query = request.query_params

    # ==============================
    # 🔥 ZONE BLOCK CHECK (FINAL FIX)
    # ==============================

    from app.models.blocked_zone import BlockedZone

    # 🔥 SAFE EXTRACT
    sub1 = query.get("sub1")
    # 🔥 FIX: ignore macros
    if sub1 and "{" in sub1:
        sub1 = None
    sub1 = str(sub1).strip() if sub1 else None

    sub2 = query.get("sub2")
    sub3 = query.get("sub3")

    # 🔥 SAFE COST PARSE
    try:
        cost = float(sub2) if sub2 else 0
    except:
        cost = 0

    # 🔥 BLOCK CHECK (ONLY IF VALID ZONE)
    if sub1:

        blocked_zone = (
            db.query(BlockedZone)
            .filter(
                BlockedZone.campaign_id == campaign.id,
                BlockedZone.zone_id == sub1,  # already string cleaned
            )
            .first()
        )

        print("ZONE:", sub1)
        print("CAMPAIGN:", campaign.id)
        print("BLOCKED:", blocked_zone)

        if blocked_zone:
            decision = "blocked"
            reason = "zone_block"
            redirect_url = campaign.safe_page_url or "/decoy"
            destination_url = redirect_url

    sub4 = query.get("sub4")
    sub5 = query.get("sub5")
    # DEFAULT VARIABLES
    selected_offer = None
    click_id = hashlib.md5(f"{ip}{datetime.utcnow()}".encode()).hexdigest()
    matched_rule = None
    reason = None
    redirect_url = None
    destination_url = None
    decision = None
    # is_bot_traffic = False
    risk_score = 0
    fingerprint = visitor.visitor_hash[:16]
    # DEBUG
    # print("REFERRER:", visitor.referrer)
    # print("USER AGENT:", visitor.user_agent_string)
    # print("IP:", visitor.ip)
    # log_raw_hit(visitor, request, db)

    # -------------------------------------------------
    # DEVICE FINGERPRINT
    # -------------------------------------------------

    raw_fp = f"{visitor.ip}-{visitor.user_agent_string}-{visitor.os}-{visitor.browser}"
    fingerprint = hashlib.sha256(raw_fp.encode()).hexdigest()[:16]
    # =========================
    # 🔒 DECISION LOCK (SAFE)
    # =========================
    lock_key = f"lock:{campaign.id}:{ip}:{fingerprint}"

    locked_decision = None

    try:
        cached = redis_client.get(lock_key)
        if cached:
            locked_decision = cached.decode() if isinstance(cached, bytes) else cached
            print("🔒 LOCK HIT:", locked_decision)
    except Exception:
        pass

    # 🔥 BOT SCORE LOCK (FIXED POSITION)
    bot_key = f"bot_score:{ip}:{fingerprint}"

    try:
        cached_score = redis_client.get(bot_key)

        if cached_score:
            print("🔒 BOT CACHE FOUND:", cached_score)
            # ❌ DO NOT OVERRIDE REAL SCORE
        else:
            redis_client.setex(bot_key, 10, int(visitor.bot_score or 0))
    except Exception:
        pass

    # -------------------------------------------------
    # CHALLENGE FINGERPRINT OVERRIDE (SAFE)
    # -------------------------------------------------

    try:
        fp_from_challenge = redis_client.get(f"fp:{ip}")

        if fp_from_challenge:
            fingerprint = (
                fp_from_challenge.decode()
                if isinstance(fp_from_challenge, bytes)
                else fp_from_challenge
            )

    except Exception:
        pass

    # -------------------------------------------------
    # TRAFFIC FILTERS
    # -------------------------------------------------

    try:

        from app.models.traffic_filter import TrafficFilter

        filters = (
            db.query(TrafficFilter)
            .filter(
                TrafficFilter.is_active == True,
                TrafficFilter.user_id
                == campaign.user_id,  # 🔥 IMPORTANT (user specific)
            )
            .all()
        )

        ua = (visitor.user_agent_string or "").lower()
        isp = (visitor.isp or "").lower()
        ref = (visitor.referrer or "").lower()

        for f in filters:

            val = (f.value or "").lower()

            # USER AGENT FILTER
            if f.category == "ua" and val in ua:
                print("🚫 UA FILTER HIT")

                decision = "blocked"
                reason = "ua_filter"

            # ISP FILTER
            elif f.category == "isp" and val in isp:
                print("🚫 ISP FILTER HIT")

                decision = "blocked"
                reason = "isp_filter"

            # DOMAIN FILTER
            elif f.category.lower() == "domain" and val in ref:
                print("🚫 DOMAIN FILTER HIT")

                decision = "blocked"
                reason = "domain_filter"

            # 🔥 IP FILTER (MISSING THA - MOST IMPORTANT)
            elif f.category == "ip" and val == visitor.ip:
                print("🚫 IP FILTER HIT:", visitor.ip)

                decision = "blocked"
                reason = "ip_filter"

            else:
                continue

            # 🔥 FINAL BLOCK ACTION (COMMON)
            redirect_url = (
                campaign.bot_url
                or campaign.safe_page_url
                or campaign.fallback_url
                or "/decoy"
            )

            destination_url = redirect_url

            is_blocked_final = True  # 🔥🔥 MOST IMPORTANT

            break  # 🔥 ek hit ke baad loop stop

    except Exception as e:
        print("FILTER ERROR:", e)

    # -------------------------------------------------
    # SESSION ANALYSIS
    # -------------------------------------------------

    # -------------------------------------------------
    # SESSION ANALYSIS
    # -------------------------------------------------

    try:

        session_score = evaluate_session(visitor)

        if session_score >= 60:
            decision = set_decision(decision, "blocked")
            reason = "filter_block"
            redirect_url = "/decoy"
            destination_url = redirect_url

    except Exception:
        pass

    # -------------------------------------------------
    # RATE LIMIT
    # -------------------------------------------------

    try:

        if not check_rate_limit(ip):
            raise HTTPException(status_code=429, detail="Too many requests")

    except Exception:
        pass

    # -------------------------------------------------
    # BLOCKED IP CHECK
    # -------------------------------------------------

    # blocked = db.query(BlockedIP).filter(BlockedIP.ip_address == ip).first()

    if blocked:
        decision = set_decision(decision, "blocked")
        reason = "filter_block"
        redirect_url = "/decoy"
        destination_url = redirect_url

    # -------------------------------------------------
    # LOAD CAMPAIGN
    # -------------------------------------------------
    # 🔥 HARD BLOCK (TOP PRIORITY)
    if visitor.is_datacenter or visitor.is_vpn or visitor.is_proxy or visitor.is_tor:
        print("🚫 HARD BLOCK: BAD NETWORK")

        return RedirectResponse(campaign.bot_url or campaign.safe_page_url or "/decoy")

    if not campaign:
        decision = set_decision(decision, "blocked")
        reason = "filter_block"
        redirect_url = "/decoy"
        destination_url = redirect_url

    # campaign inactive
    if not campaign.is_active:

        print("⛔ CAMPAIGN PAUSED")

        decision = "blocked"
        reason = "campaign_paused"

        redirect_url = campaign.safe_page_url or campaign.fallback_url or "/decoy"
        destination_url = redirect_url

        is_blocked_final = True  # 🔥 IMPORTANT

    # -------------------------------------------------
    # BOT FILTER
    # -------------------------------------------------

    try:

        # BOT FILTER

        if is_bot_traffic and visitor.bot_score >= 80:

            print("🤖 BOT → DECOY")

            decision = "blocked"
            reason = "bot_traffic"

            redirect_url = campaign.bot_url or "/decoy"
            destination_url = redirect_url

            is_blocked_final = True

    except Exception:
        pass

    # =========================================
    # 🔥 GOOGLE BOT VERIFY (ADVANCED)
    # =========================================

    ua_lower = (visitor.user_agent_string or "").lower()

    if "googlebot" in ua_lower:
        if visitor.org and "google" in visitor.org.lower():
            decision = set_decision(decision, "blocked")
            reason = "google_bot_safe"
            redirect_url = campaign.safe_page_url or "/decoy"
            destination_url = redirect_url
        else:
            decision = set_decision(decision, "blocked")
            reason = "fake_google_bot"
            redirect_url = "/decoy"
            destination_url = redirect_url

    # -------------------------------------------------
    # DEVICE FILTER
    # -------------------------------------------------

    try:

        if campaign.allowed_devices:

            allowed = campaign.allowed_devices.split(",")

            if visitor.device_type not in allowed:
                decision = set_decision(decision, "blocked")
                reason = f"device_block ({visitor.device_type})"
                redirect_url = campaign.safe_page_url or "/decoy"
                destination_url = redirect_url

        if campaign.blocked_devices:

            blocked_devices = campaign.blocked_devices.split(",")

            if visitor.device_type in blocked_devices:
                decision = set_decision(decision, "blocked")
                reason = "Blocked device"
                decision = "blocked"
                reason = "zone_block"
                redirect_url = campaign.safe_page_url or "/decoy"
                destination_url = redirect_url

    except Exception:
        pass

    # -------------------------------------------------
    # COUNTRY FILTER
    # -------------------------------------------------

    try:

        if campaign.allowed_countries:

            allowed = campaign.allowed_countries.split(",")

            if visitor.country_code not in allowed:
                decision = set_decision(decision, "blocked")
                reason = f"country_block({visitor.country})"
                redirect_url = campaign.safe_page_url or "/decoy"
                destination_url = redirect_url

        if campaign.blocked_countries:

            blocked_countries = campaign.blocked_countries.split(",")

            if visitor.country_code in blocked_countries:
                decision = set_decision(decision, "blocked")
                reason = f"country_block({visitor.country_code})"
                redirect_url = campaign.safe_page_url or "/decoy"
                destination_url = redirect_url

    except Exception:
        pass

    # -------------------------------------------------
    # TOKEN REDIRECT
    # -------------------------------------------------

    if token:

        if is_token_used(token):
            raise HTTPException(status_code=403, detail="Token already used")

        try:

            redirect_url = decode_secure_token(
                token,
                visitor.ip,
                visitor.user_agent_string,
            )

        except Exception:
            raise HTTPException(status_code=400, detail="Invalid token")

        mark_token_used(token)

        return RedirectResponse(redirect_url or campaign.fallback_url or "/decoy")

    # -------------------------------------------------
    # PROXY MODE (FINAL CLEAN)
    # -------------------------------------------------

    proxied_url = request.query_params.get("__ti_url__")

    # 🔥 ASSET SUPPORT
    if not proxied_url and any(
        request.url.path.endswith(ext)
        for ext in [
            ".js",
            ".css",
            ".png",
            ".jpg",
            ".jpeg",
            ".gif",
            ".svg",
            ".ico",
            ".mp4",
            ".mp3",
            ".webp",
            ".json",
            ".woff",
            ".woff2",
            ".ttf",
        ]
    ):
        proxied_url = request.query_params.get("__ti_url__")

    if proxied_url:

        target_url = urllib.parse.unquote(proxied_url)

        if not target_url.startswith("http"):
            raise HTTPException(status_code=400, detail="Invalid proxy URL")

        try:

            async with httpx.AsyncClient(timeout=25, follow_redirects=True) as client:

                proxy_response = await client.request(
                    method=request.method,
                    url=target_url,
                    headers={
                        "user-agent": request.headers.get("user-agent"),
                        "accept": "*/*",
                        "referer": target_url,
                        "origin": target_url,
                    },
                    content=await request.body(),
                )

            content_type = proxy_response.headers.get("content-type", "")
            content = proxy_response.content

            # 🔥 HTML REWRITE
            if "text/html" in content_type:

                html = proxy_response.text

                # BASE FIX
                html = html.replace(
                    "<head>", f'<head><base href="/r/{slug}?__ti_url__={target_url}/">'
                )

                # RELATIVE LINKS
                html = html.replace(
                    'href="/', f'href="/r/{slug}?__ti_url__={target_url}/'
                )
                html = html.replace(
                    'src="/', f'src="/r/{slug}?__ti_url__={target_url}/'
                )

                # ABSOLUTE LINKS
                html = html.replace(target_url, f"/r/{slug}?__ti_url__={target_url}")

                # API CALLS
                html = html.replace(
                    'fetch("/', f'fetch("/r/{slug}?__ti_url__={target_url}/'
                )
                html = html.replace(
                    'axios.get("/', f'axios.get("/r/{slug}?__ti_url__={target_url}/'
                )

                return Response(
                    content=html,
                    media_type="text/html",
                    headers={
                        "Access-Control-Allow-Origin": "*",
                        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
                        "Pragma": "no-cache",
                        "Expires": "0",
                    },
                )

            # 🔥 ASSETS / VIDEO / FILES
            return Response(
                content=content,
                media_type=content_type,
                headers={
                    "Access-Control-Allow-Origin": "*",
                    "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
                    "Pragma": "no-cache",
                    "Expires": "0",
                },
            )

        except Exception as e:
            print("PROXY ERROR:", e)
            return RedirectResponse(target_url)

    # -------------------------------------------------
    # RAPID CLICK DETECTION
    # -------------------------------------------------

    try:

        rate_key = f"rapid:{ip}"

        hits = redis_client.incr(rate_key)

        redis_client.expire(rate_key, 5)

        if hits > 15:

            decision = set_decision(decision, "blocked")
            reason = "filter_block"
            redirect_url = "/decoy"
            destination_url = redirect_url

    except Exception:
        pass

    # -------------------------------------------------
    # TRAFFIC FILTER CHECK
    # -------------------------------------------------

    try:

        filter_hit = check_traffic_filters(visitor, db)

        if filter_hit:

            decision = set_decision(decision, "blocked")
            reason = "filter_block"
            redirect_url = "/decoy"
            destination_url = redirect_url

    except Exception:
        pass

    # -------------------------------------------------
    # RISK ENGINE (FIXED ✅)
    # -------------------------------------------------
    try:
        risk_engine = RiskEngine(visitor, campaign)
        risk_score = risk_engine.calculate()
    except Exception:
        risk_score = visitor.bot_score

    # =========================================
    # 🔥 BOT CLASSIFIER (AI)
    # =========================================
    try:
        classifier = BotClassifier(visitor)
        bot_type = classifier.classify()

        # 🔥 ONLY HARD BLOCK HIGH BOT
        if bot_type == "bot" and visitor.bot_score >= 80:
            is_bot_traffic = True
            decision = set_decision(decision, "blocked")
            reason = "ai_bot_detected"

            # 🔥 BOT → ALWAYS BOT URL
            redirect_url = campaign.bot_url or "/decoy"
            destination_url = redirect_url

    # ❌ REMOVE RETURN

    except Exception:
        pass

    # ---------------------------------
    # AUTO LEARNING (FIXED ✅)
    # ---------------------------------
    try:
        if risk_score >= 80:
            increase_ip_risk(ip, 20)
        elif risk_score >= 50:
            increase_ip_risk(ip, 10)
        elif risk_score < 20:
            increase_ip_risk(ip, -5)
    except Exception:
        pass

    # ---------------------------------
    # RISK BASED BLOCK (FIXED ✅)
    # ---------------------------------

    # normalize bot influence
    if visitor.bot_score >= 80 and risk_score < 60:
        risk_score = visitor.bot_score

    # 🔥 HIGH RISK BLOCK
    # 🔥 HIGH RISK BLOCK
    if risk_score >= 70 or visitor.bot_score >= 80:
        print("🚫 HIGH RISK BLOCK")

        decision = set_decision(decision, "blocked")
        reason = "fraud_traffic"

        is_bot_traffic = True
        is_blocked_final = True  # 🔥 MOST IMPORTANT

        redirect_url = campaign.safe_page_url or "/decoy"
        destination_url = redirect_url

    # =========================================
    # 🔥 DECISION ENGINE (SAFE LAYER) — ALWAYS RUN
    # =========================================
    try:
        decision_type, final_score = compute_final_decision(visitor, risk_score)

        # 🔥 SAVE CLEAN USERS (FIXED POSITION)
        # try:
        #     if decision_type == "allow":
        #         redis_client.setex(f"fast_pass:{ip}", 300, "1")  # 5 min cache
        # except Exception:
        #     pass

        # 🔥 escalate only
        if decision_type == "blocked" and decision != "blocked":
            decision = set_decision(decision, "blocked")
            reason = "decision_engine_block"
            redirect_url = campaign.safe_page_url or "/decoy"
            destination_url = redirect_url

        # 🔥 challenge trigger
        elif decision_type == "challenge":

            try:
                challenge_pass = redis_client.get(f"challenge_pass:{ip}")
            except Exception:
                challenge_pass = None

            # 🔥 FINAL FIX
            if challenge_pass:
                print("✅ CHALLENGE ALREADY PASSED → FORCE ALLOW")
                is_bot_traffic = False
                decision_type = "allow"

            elif ENABLE_CHALLENGE_LOCAL and campaign.is_active:

                decision = "challenge"
                reason = "decision_engine_challenge"

                redirect_url = f"/challenge/{slug}"
                return RedirectResponse(redirect_url, status_code=302)

    except Exception:
        pass
    # -------------------------------------------------
    # DATACENTER HARD BLOCK (ALWAYS INDEPENDENT)
    # -------------------------------------------------
    try:
        if getattr(visitor, "is_datacenter", False):
            if campaign.block_datacenter:
                decision = set_decision(decision, "blocked")
                reason = "datacenter_block"
                redirect_url = campaign.bot_url or campaign.safe_page_url or "/decoy"
                destination_url = redirect_url
    except Exception:
        pass

    # ==============================
    # RULE ENGINE
    # ==============================

    if decision != "blocked" and not proxied_url and not is_bot_traffic:

        try:

            rule_engine = RuleEngine(db, campaign, visitor)
            matched_rule = rule_engine.evaluate()

            if matched_rule:
                # 🔥 HARD LOCK
                is_bot_traffic = is_bot_traffic

                if matched_rule.action_type == "block":

                    decision = set_decision(decision, "blocked")
                    reason = f"rule_match:{matched_rule.name}"

                    redirect_url = "/decoy"
                    destination_url = redirect_url

                elif matched_rule.action_type == "rotate":

                    selected_offer = choose_offer_for_rule(db, matched_rule.id)

                    if matched_rule and selected_offer:

                        decision = "offer"
                        reason = "offer"

                        redirect_url = selected_offer.url
                        print("🔥 FINAL DECISION:", decision)
                        print("🔥 USING URL:", redirect_url)
                        redirect_url = append_click_id(redirect_url, click_id)

                        # MACRO REPLACE
                        redirect_url = redirect_url.replace("{sub1}", sub1 or "")
                        redirect_url = redirect_url.replace("{sub2}", sub2 or "")
                        redirect_url = redirect_url.replace("{sub3}", sub3 or "")
                        redirect_url = redirect_url.replace("{sub4}", sub4 or "")
                        redirect_url = redirect_url.replace("{sub5}", sub5 or "")

                        destination_url = redirect_url

        except Exception as e:
            # print("RULE ENGINE ERROR:", e)
            pass

    # -------------------------------------------------
    # ROUTING ENGINE
    # -------------------------------------------------

    try:
        if not is_bot_traffic and not is_blocked_final:

            routing_engine = RoutingEngine(visitor, campaign)
            routed = routing_engine.evaluate()

            if routed:
                redirect_url = routed
                decision = "offer"
                destination_url = routed

    except Exception:
        pass

    # =========================
    # 🔒 APPLY DECISION LOCK
    # =========================
    if locked_decision and decision not in ["blocked", "challenge"]:
        print("🔒 USING LOCKED DECISION:", locked_decision)

        if locked_decision == "offer":
            decision = "offer"

        elif locked_decision == "fallback":
            decision = "fallback"

    # -------------------------------------------------
    # FINAL DECISION LOGIC (CLEAN + SAFE)
    # -------------------------------------------------

    if matched_rule:

        if matched_rule.action_type == "block":

            decision = set_decision(decision, "blocked")
            reason = f"rule_match:{matched_rule.name}"

            redirect_url = "/decoy"
            destination_url = redirect_url

        elif matched_rule.action_type == "rotate" and selected_offer:

            decision = "offer"
            reason = "rule_match"

            redirect_url = selected_offer.url
            print("🔥 FINAL DECISION:", decision)
            print("🔥 USING URL:", redirect_url)

            redirect_url = redirect_url.replace("{sub1}", sub1 or "")
            redirect_url = redirect_url.replace("{sub2}", sub2 or "")
            redirect_url = redirect_url.replace("{sub3}", sub3 or "")
            redirect_url = redirect_url.replace("{sub4}", sub4 or "")
            redirect_url = redirect_url.replace("{sub5}", sub5 or "")

            destination_url = redirect_url

    # 🔥 NO RULE MATCH → SAFE PAGE (STRICT MODE)
    elif not is_bot_traffic and not is_blocked_final and not proxied_url:

        decision = "fallback"
        reason = "no_rule_match"

        redirect_url = campaign.fallback_url or campaign.safe_page_url or "/decoy"
        destination_url = redirect_url
    # -------------------------------------------------
    # FALLBACK (only if no offer selected)
    # -------------------------------------------------

    if not redirect_url:

        decision = "fallback"
        redirect_url = campaign.fallback_url or "/decoy"
        destination_url = redirect_url
        reason = "fallback"
    redirect_url = append_click_id(redirect_url, click_id)

    # 🔥 FINAL DEDUPE (FIXED ✅)

    # 🔥 FINAL HARD DEDUPE (NO DOUBLE LOG)
    log_key = f"log:{ip}:{campaign.id}:{fingerprint}"

    should_log_final = True

    try:
        if redis_client.get(log_key):
            print("⚠️ FINAL DUPLICATE DETECTED (LOG SKIPPED)")
            # ❌ DO NOT BLOCK FLOW
            should_log_final = False
        else:
            redis_client.setex(log_key, 10, "1")
    except Exception:
        should_log_final = True

    # =========================
    # 🔒 SAVE DECISION LOCK
    # =========================
    try:
        if decision in ["offer", "fallback"]:
            redis_client.setex(lock_key, 300, decision)  # 5 min lock
            print("🔒 LOCK SAVED:", decision)
    except Exception:
        pass

    # ---------------------------------
    # 🔥 PLAN LIMIT HARD BLOCK (FINAL FIX)
    # ---------------------------------
    print("🔥 CHECKING PLAN LIMIT FOR USER:", campaign.user_id)

    try:
        check_click_limit(db, campaign.user_id)

    except HTTPException:
        print("🚫 PLAN LIMIT REACHED")

        decision = "blocked"
        reason = "plan_limit_reached"

        redirect_url = campaign.safe_page_url or "/decoy"
        destination_url = redirect_url

        is_blocked_final = True

        # 🔥 LOCK CLEAR
        try:
            redis_client.delete(lock_key)
            print("🧹 LOCK CLEARED")
        except Exception:
            pass
    # -------------------------------------------------
    # CLICK LOGGING

    try:
        # print("LOG DEBUG")
        # print("DECISION:", decision)
        # print("REASON:", reason)
        # print("DESTINATION:", destination_url)
        if should_log_final and request.method == "GET":

            print("🔥 REAL CLICK LOGGED")

            click = ClickLog(
                campaign_id=campaign.id,
                user_id=campaign.user_id,
                traffic_source=visitor.traffic_source,
                traffic_medium=visitor.traffic_medium,
                rule_id=matched_rule.id if matched_rule else None,
                offer_id=selected_offer.id if selected_offer else None,
                ip_address=ip,
                country=visitor.country,
                click_id=click_id,
                sub1=sub1,
                sub2=sub2,
                sub3=sub3,
                sub4=sub4,
                sub5=sub5,
                cost=cost,
                payout=0,
                region=visitor.region,
                city=visitor.city,
                user_agent=visitor.user_agent_string,
                browser=visitor.browser,
                os=visitor.os,
                device_type=visitor.device_type,
                language=visitor.language,
                ip_timezone=visitor.ip_timezone,
                asn=visitor.asn,
                isp=visitor.isp,
                org=visitor.org,
                connection_type=visitor.connection_type,
                bot_score=visitor.bot_score,
                is_bot=visitor.is_bot,
                risk_score=risk_score,
                fingerprint=fingerprint,
                referrer=visitor.referrer if visitor.referrer else None,
                query_string=visitor.query_string,
                status=decision,
                reason=reason,
                destination=destination_url or redirect_url,
            )

            db.add(click)

            update_daily_stats(
                db=db,
                campaign=campaign,
                rule=matched_rule,
                offer=selected_offer,
                decision=decision,
                visitor=visitor,
            )

            db.commit()

            # 🔥 ADD THIS HERE (ONLY HERE)
            try:
                status_map = {"offer": "pass", "fallback": "safe", "blocked": "blocked"}

                await broadcast(
                    {
                        "campaign": campaign.name,
                        "country": visitor.country,
                        "device": visitor.device_type,
                        "ip": ip,
                        "status": status_map.get(decision, decision),
                        "time": datetime.utcnow().isoformat() + "Z",
                    }
                )
                print("🚀 WS BROADCAST SENT")
            except Exception as e:
                print("❌ BROADCAST ERROR:", e)

            # ---------------------------------
            # AI LEARNING ENGINE
            # ---------------------------------
            try:
                update_campaign_learning(campaign.id, decision)
                update_source_learning(visitor.traffic_source, decision)
            except Exception:
                pass

    except Exception:
        db.rollback()

    # -------------------------------------------------
    # BLOCK HANDLING (SAFE)
    # -------------------------------------------------
    print("🔥 FINAL DECISION:", decision)
    print("🔥 FINAL URL:", redirect_url)
    print("🔥 RISK SCORE:", risk_score)
    print("🔥 BOT:", visitor.is_bot)
    if decision == "blocked":

        print("🚫 FINAL BLOCK EXECUTED")

        # 🔥 ALWAYS FORCE SAFE URL (NO LEAK)
        safe_url = campaign.safe_page_url or "/decoy"

        if is_bot_traffic or visitor.is_datacenter:
            return RedirectResponse(campaign.bot_url or safe_url)

        return RedirectResponse(safe_url)

    # -------------------------------------------------
    # OFFER REDIRECT MODES
    # -------------------------------------------------

    if selected_offer:
        mode = selected_offer.redirect_mode
        print("🔥 MODE:", mode)

        # -----------------------------
        # DIRECT MODE
        # -----------------------------
        if mode == "direct":
            return RedirectResponse(redirect_url or campaign.fallback_url or "/decoy")

        # -----------------------------
        # TOKEN MODE
        # -----------------------------
        if mode == "token":

            new_token = generate_secure_token(
                redirect_url,
                visitor.ip,
                visitor.user_agent_string,
            )

            return RedirectResponse(f"/r/{slug}/{new_token}")

        # -----------------------------
        # PROXY MODE
        # -----------------------------
        if mode == "proxy":

            try:

                async with httpx.AsyncClient(
                    timeout=15, follow_redirects=True
                ) as client:
                    proxy_response = await client.get(redirect_url)

                content_type = proxy_response.headers.get("content-type", "text/html")

                content = proxy_response.content

                if "text/html" in content_type:

                    engine = RewriteEngine(
                        base_url=redirect_url,
                        slug=slug,
                        ip=visitor.ip,
                        user_agent=visitor.user_agent_string,
                    )

                    content = engine.rewrite_html(proxy_response.text).encode()

                return Response(content=content, media_type=content_type)

            except Exception:

                return RedirectResponse(
                    redirect_url or campaign.fallback_url or "/decoy"
                )

        # -----------------------------
        # FULL PROXY MODE
        # -----------------------------
        # if mode == "full_proxy":

        #     try:

        #         async with httpx.AsyncClient(
        #             timeout=20, follow_redirects=True
        #         ) as client:
        #             proxy_response = await client.get(redirect_url)

        #         content_type = proxy_response.headers.get("content-type", "text/html")

        #         content = proxy_response.content

        #         if "text/html" in content_type:

        #             engine = RewriteEngine(
        #                 base_url=redirect_url,
        #                 slug=slug,
        #                 ip=visitor.ip,
        #                 user_agent=visitor.user_agent_string,
        #             )

        #             content = engine.rewrite_html(proxy_response.text).encode()

        #         return Response(content=content, media_type=content_type)

        #     except Exception:

        #         return RedirectResponse(
        #             redirect_url or campaign.fallback_url or "/decoy"
        #         )

    # =========================================
    # 🔥 FINAL BLOCK LOCK (FAST + SAFE)
    # =========================================
    if is_blocked_final:
        print("🚫 FINAL BLOCK LOCK ACTIVE")

        # 🔥 BOT → safe page
        if visitor.is_bot:
            final_url = campaign.safe_page_url or "/decoy"

        # 🔥 CLEAN BUT BLOCKED → bot url (trap)
        else:
            final_url = campaign.bot_url or campaign.safe_page_url or "/decoy"

        return RedirectResponse(final_url)
    return smart_redirect(redirect_url or campaign.fallback_url or "/decoy")
