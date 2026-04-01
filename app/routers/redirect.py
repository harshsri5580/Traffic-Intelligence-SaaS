from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse, Response
from sqlalchemy.orm import Session
import asyncio
from datetime import datetime
import random
import httpx
import urllib.parse
import hashlib
from app.core.config import ENABLE_CHALLENGE, BASE_URL
from app.database import get_db
from app.models import campaign
from app.models.campaign import Campaign
from app.models.offer import Offer
from app.models.blocked_ip import BlockedIP
from app.models.click_log import ClickLog
from app.models.raw_hit_log import RawHitLog
from app.services.bot_classifier import BotClassifier
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


def set_decision(current, new):
    if current == "blocked":
        return current
    return new


def append_click_id(url, click_id):
    try:
        if "click_id=" in url:
            return url
        separator = "&" if "?" in url else "?"
        return f"{url}{separator}click_id={click_id}"
    except:
        return url


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


@router.api_route("/r/{slug}", methods=["GET", "POST"])
@router.api_route("/r/{slug}/{token}", methods=["GET", "POST"])
async def redirect_campaign(
    slug: str,
    request: Request,
    token: str | None = None,
    db: Session = Depends(get_db),
):

    visitor = VisitorContext(request)
    ip = visitor.ip
    print("FINAL IP:", ip)

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
    blocked = db.query(BlockedIP).filter(BlockedIP.ip_address == ip).first()

    if blocked:
        print("🚫 BLOCKED IP HIT:", ip)
        decision = "blocked"
        reason = "blocked_ip"
        redirect_url = campaign.safe_page_url or "/decoy"

    campaign = (
        db.query(Campaign)
        .filter(
            Campaign.slug == slug,
            Campaign.is_deleted == False,
        )
        .first()
    )

    if not campaign:
        decision = "blocked"
        reason = "campaign_not_found"
        redirect_url = "/decoy"

    # 🔥 SUBSCRIPTION CHECK (FINAL FIX)

    sub = (
        db.query(Subscription).filter(Subscription.user_id == campaign.user_id).first()
    )

    if sub:

        if sub.expire_date and sub.expire_date < datetime.utcnow():

            sub.status = "expired"
            db.commit()

            # pause campaign
            # campaign.is_active = False
            db.commit()

            if campaign.fallback_url:
                decision = "fallback"
                reason = "subscription_expired"
                redirect_url = campaign.fallback_url or "/decoy"

            return RedirectResponse("/decoy")

    # ---------------------------------
    # SUBID TRACKING PARAMS
    # ---------------------------------

    # -------------------------------------------------
    # CHALLENGE CHECK (MOVE HERE - EARLY)
    # -------------------------------------------------

    try:
        challenge_pass = redis_client.get(f"challenge_pass:{ip}")
    except Exception:
        challenge_pass = None
    print("IP:", ip)
    print("CHALLENGE KEY:", redis_client.get(f"challenge_pass:{ip}"))

    if ENABLE_CHALLENGE and not challenge_pass:

        # 🔥 Only suspicious traffic
        if (
            visitor.bot_score >= 30
            or visitor.connection_type in ["vpn", "datacenter"]
            or visitor.is_bot
        ):

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

                if not is_duplicate:
                    db.add(click)
                    db.commit()

            except Exception:
                db.rollback()

            # 🔥 REDIRECT TO CHALLENGE
            return RedirectResponse(f"/challenge/{slug}")

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
            print("🚫 BLOCKED ZONE HIT:", sub1)
            decision = "blocked"
            reason = "zone_block"
            redirect_url = campaign.safe_page_url or "/decoy"

    sub4 = query.get("sub4")
    sub5 = query.get("sub5")
    # DEFAULT VARIABLES
    selected_offer = None
    click_id = hashlib.md5(f"{ip}{datetime.utcnow()}".encode()).hexdigest()
    matched_rule = None
    decision = None
    reason = None
    redirect_url = None
    destination_url = None
    is_bot_traffic = False
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

    try:

        raw_fp = (
            f"{visitor.ip}-{visitor.user_agent_string}-{visitor.os}-{visitor.browser}"
        )

        fingerprint = hashlib.sha256(raw_fp.encode()).hexdigest()[:16]

    except Exception:

        fingerprint = None

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

        filters = db.query(TrafficFilter).filter(TrafficFilter.is_active == True).all()

        ua = (visitor.user_agent_string or "").lower()
        isp = (visitor.isp or "").lower()
        ref = (visitor.referrer or "").lower()

        for f in filters:

            val = (f.value or "").lower()
            # print("FILTER VALUE:", f.value)
            # print("REF:", ref)

            # USER AGENT FILTER
            if f.category == "ua" and val in ua:
                # print("UA FILTER HIT")
                decision = set_decision(decision, "blocked")
                reason = "filter_block"
                redirect_url = "/decoy"
                destination_url = redirect_url

            # ISP FILTER
            if f.category == "isp" and val in isp:
                print("ISP FILTER HIT")
                decision = set_decision(decision, "blocked")
                reason = "filter_block"
                redirect_url = "/decoy"
                destination_url = redirect_url

            # DOMAIN FILTER
            if f.category.lower() == "domain" and val in ref:
                # print("DOMAIN FILTER HIT")
                decision = set_decision(decision, "blocked")
                reason = "filter_block"
                redirect_url = "/decoy"
                destination_url = redirect_url

    except Exception:
        pass

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

    blocked = db.query(BlockedIP).filter(BlockedIP.ip_address == ip).first()

    if blocked:
        decision = set_decision(decision, "blocked")
        reason = "filter_block"
        redirect_url = "/decoy"
        destination_url = redirect_url

    # -------------------------------------------------
    # LOAD CAMPAIGN
    # -------------------------------------------------

    if not campaign:
        decision = set_decision(decision, "blocked")
        reason = "filter_block"
        redirect_url = "/decoy"
        destination_url = redirect_url

    # campaign inactive
    if not campaign.is_active:

        if campaign.fallback_url:
            return RedirectResponse(campaign.fallback_url)

        if campaign.safe_page_url:
            decision = set_decision(decision, "blocked")
            reason = "google_bot_safe"
            redirect_url = campaign.safe_page_url or "/decoy"
            destination_url = redirect_url

        return RedirectResponse("https://google.com")

    # -------------------------------------------------
    # BOT FILTER
    # -------------------------------------------------

    try:

        # BOT FILTER

        is_bot_traffic = (
            visitor.is_bot or visitor.bot_score >= 80 or visitor.device_type == "bot"
        )

        if is_bot_traffic:

            decision = set_decision(decision, "blocked")
            reason = "bot_detected"

            if campaign.bot_url:
                redirect_url = campaign.bot_url
            else:
                redirect_url = "/decoy"

            destination_url = redirect_url

            print("BOT REDIRECT:", redirect_url)

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
                redirect_url = campaign.safe_page_url or "/decoy"

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
                return RedirectResponse(campaign.safe_page_url or "/decoy")

        if campaign.blocked_countries:

            blocked_countries = campaign.blocked_countries.split(",")

            if visitor.country_code in blocked_countries:
                decision = set_decision(decision, "blocked")
                reason = f"country_block({visitor.country_code})"
                decision = "blocked"
                redirect_url = campaign.safe_page_url or "/decoy"

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
    # PROXY MODE
    # -------------------------------------------------

    proxied_url = request.query_params.get("__ti_url__")

    if proxied_url:

        redirect_url = urllib.parse.unquote(proxied_url)

        if not redirect_url.startswith("http"):
            raise HTTPException(status_code=400, detail="Invalid proxy URL")

        try:

            async with httpx.AsyncClient(timeout=15, follow_redirects=True) as client:
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

            return RedirectResponse(redirect_url or campaign.fallback_url or "/decoy")

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

        if bot_type == "bot":
            is_bot_traffic = True
            decision = set_decision(decision, "blocked")
            reason = "ai_bot_detected"

            redirect_url = campaign.safe_page_url or "/decoy"
            destination_url = redirect_url

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
    if risk_score >= 80 and not is_bot_traffic:
        decision = set_decision(decision, "blocked")
        reason = "fraud_traffic"

        is_bot_traffic = True
        redirect_url = campaign.safe_page_url or "/decoy"
        destination_url = redirect_url

    # =========================================
    # 🔥 DECISION ENGINE (SAFE LAYER) — ALWAYS RUN
    # =========================================
    try:
        decision_type, final_score = compute_final_decision(visitor, risk_score)

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

            if ENABLE_CHALLENGE and not challenge_pass:
                return RedirectResponse(f"/challenge/{slug}")

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
                redirect_url = "/decoy"
                destination_url = redirect_url
    except Exception:
        pass

    # ==============================
    # RULE ENGINE
    # ==============================

    if not is_bot_traffic:

        try:

            rule_engine = RuleEngine(db, campaign, visitor)
            matched_rule = rule_engine.evaluate()

            if matched_rule:
                # 🔥 HARD LOCK
                is_bot_traffic = True

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
        if not is_bot_traffic:

            routing_engine = RoutingEngine(visitor, campaign)
            routed = routing_engine.evaluate()

            if routed:
                redirect_url = routed
                decision = "offer"
                destination_url = routed

    except Exception:
        pass

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

            redirect_url = redirect_url.replace("{sub1}", sub1 or "")
            redirect_url = redirect_url.replace("{sub2}", sub2 or "")
            redirect_url = redirect_url.replace("{sub3}", sub3 or "")
            redirect_url = redirect_url.replace("{sub4}", sub4 or "")
            redirect_url = redirect_url.replace("{sub5}", sub5 or "")

            destination_url = redirect_url

    # 🔥 NO RULE MATCH → SAFE PAGE (STRICT MODE)
    elif not is_bot_traffic:

        decision = "blocked"
        reason = "no_rule_match"

        redirect_url = campaign.safe_page_url or "/decoy"
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

    # =========================================
    # 🔥 STEALTH PARAM (ANTI DETECT)
    # =========================================
    try:
        if redirect_url:
            rnd = hashlib.md5(str(random.random()).encode()).hexdigest()[:6]

            if "?" in redirect_url:
                redirect_url = f"{redirect_url}&_r={rnd}"
            else:
                redirect_url = f"{redirect_url}?_r={rnd}"
    except Exception:
        pass

    # 🔥 FINAL DEDUPE (FIXED ✅)

    dedupe_key = f"click:{ip}:{campaign.id}"
    is_duplicate = False

    try:
        if redis_client.get(dedupe_key):
            print("⚠️ DEDUPE HIT")
            is_duplicate = True
        else:
            redis_client.setex(dedupe_key, 5, "1")
    except Exception as e:
        print("REDIS ERROR:", e)
        is_duplicate = False
    # -------------------------------------------------
    # CLICK LOGGING

    try:
        # print("LOG DEBUG")
        # print("DECISION:", decision)
        # print("REASON:", reason)
        # print("DESTINATION:", destination_url)
        # 🔥 ONLY LOG MAIN REDIRECT
        # 🔥 ONLY LOG MAIN REDIRECT
        should_log = request.url.path.startswith("/r/")
        if should_log and not is_duplicate:
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
                referrer=visitor.referrer,
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

            # ---------------------------------
            # AI LEARNING ENGINE
            # ---------------------------------
            try:
                update_campaign_learning(campaign.id, decision)
                update_source_learning(visitor.traffic_source, decision)
            except Exception:
                pass

            try:
                await broadcast(
                    {
                        "campaign": campaign.name,
                        "country": visitor.country,
                        "device": visitor.device_type,
                        "ip": visitor.ip,
                        "status": decision,
                        "time": datetime.utcnow().isoformat(),
                    }
                )
            except Exception:
                pass

    except Exception:
        db.rollback()

    # -------------------------------------------------
    # BLOCK HANDLING (SAFE)
    # -------------------------------------------------

    if decision == "blocked":
        print("🚫 FINAL BLOCK:", reason)
        return RedirectResponse(destination_url or campaign.safe_page_url or "/decoy")

    # -------------------------------------------------
    # OFFER REDIRECT MODES
    # -------------------------------------------------

    if selected_offer:

        mode = selected_offer.redirect_mode

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
        if mode == "full_proxy":

            try:

                async with httpx.AsyncClient(
                    timeout=20, follow_redirects=True
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

    # =========================================
    # 🔥 MICRO DELAY (ANTI BOT)

    try:
        if not visitor.is_bot:
            await asyncio.sleep(random.uniform(0.05, 0.2))
    except Exception:
        pass

    return RedirectResponse(redirect_url or campaign.fallback_url or "/decoy")
