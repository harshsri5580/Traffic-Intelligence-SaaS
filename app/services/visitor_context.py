import hashlib
from fastapi import Request
from user_agents import parse
from urllib.parse import parse_qs
import json
from app.services.redis_client import redis_client

from app.services.geo import get_geo_data, get_asn_data


class VisitorContext:

    def __init__(self, request: Request):

        self.request = request

        # ================================
        # SAFE IP DETECTION
        # ================================

        forwarded = request.headers.get("x-forwarded-for") or request.headers.get(
            "X-Forwarded-For"
        )

        self.ip = (
            (
                forwarded.split(",")[0].strip() if forwarded else None
            )  # ✅ FIRST PRIORITY
            or request.headers.get("cf-connecting-ip")
            or request.headers.get("x-real-ip")
            or (request.client.host if request.client else None)
            or "0.0.0.0"
        )

        if self.ip in ["127.0.0.1", "0.0.0.0"]:
            self.ip = "103.46.203.161"

        headers = request.headers

        self.user_agent_string = headers.get("user-agent", "")
        self.referrer = headers.get("referer")
        self.language = headers.get("accept-language")
        self.host = headers.get("host")

        self.query_string = str(request.url.query)

        # ================================
        # SESSION
        # ================================

        self.visitor_id = request.cookies.get("ti_vid")
        self.is_returning = bool(self.visitor_id)

        # ================================
        # DEFAULT VALUES
        # ================================

        self.browser = None
        self.os = None
        self.device_type = "unknown"

        self.is_bot = False
        self.bot_score = 0

        self.country = "unknown"
        self.country_code = "XX"
        self.region = None
        self.city = None
        self.ip_timezone = None

        self.asn = None
        self.org = None
        self.isp = None

        self.ip_type = "unknown"
        self.connection_type = "unknown"

        # ---------- protection flags ----------

        self.is_vpn = False
        self.is_proxy = False
        self.is_tor = False
        self.is_datacenter = False
        self.is_automation = False
        self.canvas_fingerprint = None

        self.traffic_source = "direct"
        self.traffic_medium = "none"

        # ================================
        # USER AGENT PARSE
        # ================================

        if self.user_agent_string:

            try:

                ua = parse(self.user_agent_string)

                self.browser = (
                    ua.browser.family.lower().replace("mobile ", "").lower()
                    if ua.browser.family
                    else None
                )
                self.os = ua.os.family.lower() if ua.os.family else None

                if ua.is_mobile:
                    self.device_type = "mobile"

                elif ua.is_tablet:
                    self.device_type = "tablet"

                elif ua.is_pc:
                    self.device_type = "desktop"

                if ua.is_bot:
                    self.device_type = "bot"
                    self.is_bot = True
                    self.bot_score += 60

            except Exception:
                pass

        # =========================================
        # 🔥 HEADER SPOOF DETECTION
        # =========================================
        try:
            if self.user_agent_string:

                ua_lower = self.user_agent_string.lower()

                # ❌ fake browser patterns
                if "chrome" in ua_lower and not self.browser:
                    self.bot_score += 20

                if "windows" in ua_lower and self.os and "windows" not in self.os:
                    self.bot_score += 15

                if "android" in ua_lower and self.device_type == "desktop":
                    self.bot_score += 25

        except Exception:
            pass

        # ================================
        # BOT KEYWORD DETECTION
        # ================================

        ua_lower = self.user_agent_string.lower()

        bot_keywords = [
            "curl",
            "wget",
            "python",
            "scrapy",
            "bot",
            "crawler",
            "spider",
            "httpclient",
            "java",
            "libwww",
            "node-fetch",
            "axios",
            "go-http-client",
            "okhttp",
            "postman",
            "headless",
            "phantom",
            "selenium",
            "playwright",
            "puppeteer",
        ]

        automation_keywords = [
            "selenium",
            "playwright",
            "puppeteer",
            "headless",
            "phantom",
        ]

        if any(a in ua_lower for a in automation_keywords):

            self.is_automation = True
            self.bot_score += 50

        if any(k in ua_lower for k in bot_keywords):

            self.is_bot = True
            self.device_type = "bot"
            self.bot_score += 60

        # ================================
        # KNOWN CRAWLER DETECTION
        # ================================

        crawler_keywords = [
            "googlebot",
            "adsbot-google",
            "facebookexternalhit",
            "facebot",
            "twitterbot",
            "linkedinbot",
        ]

        if any(c in ua_lower for c in crawler_keywords):

            self.is_bot = True
            self.device_type = "bot"
            self.bot_score += 80

        # ================================
        # GEO DETECTION
        # ================================

        try:

            geo = get_geo_data(self.ip)

            if geo:

                self.country = geo.get("country") or "unknown"
                self.country_code = geo.get("country_code") or "XX"
                self.region = geo.get("region")
                self.city = geo.get("city")
                self.ip_timezone = geo.get("timezone")
                self.isp = geo.get("isp")

        except Exception:
            pass

        # ================================
        # ASN DETECTION
        # ================================

        try:

            asn_data = get_asn_data(self.ip)

            if asn_data:

                self.asn = asn_data.get("asn")
                self.org = asn_data.get("org")
                self.isp = asn_data.get("org")

        except Exception:
            pass
        # =========================================
        # 🔥 GEO-ASN CONSISTENCY CHECK
        # =========================================
        try:
            if self.country_code and self.org:

                org_lower = self.org.lower()

                if self.country_code == "IN" and "amazon" in org_lower:
                    self.bot_score += 15

                if self.country_code == "US" and "vps" in org_lower:
                    self.bot_score += 20

        except Exception:
            pass
        # ================================
        # DATACENTER DETECTION
        # ================================

        if self.org:

            org_lower = self.org.lower()

            dc_keywords = [
                "amazon",
                "aws",
                "google",
                "digitalocean",
                "microsoft",
                "azure",
                "ovh",
                "linode",
                "vultr",
                "alibaba",
                "hetzner",
                "cloudflare",
                "oracle",
                "leaseweb",
                "colo",
                "datacenter",
                "hosting",
            ]

            if any(k in org_lower for k in dc_keywords):

                self.ip_type = "datacenter"
                self.connection_type = "datacenter"
                self.is_datacenter = True
                self.bot_score += 40

        # ================================
        # VPN DETECTION
        # ================================

        if self.org:

            vpn_keywords = ["vpn", "proxy", "hosting", "server"]

            if any(k in self.org.lower() for k in vpn_keywords):

                self.connection_type = "vpn"
                self.is_vpn = True
                self.bot_score += 30

        # ================================
        # VPN / PROXY / TOR DETECTION
        # ================================

        from app.services.vpn_detector import detect_vpn

        vpn_info = detect_vpn(self.ip, org=self.org, asn=self.asn)

        self.is_vpn = vpn_info.get("is_vpn", False)
        self.is_proxy = vpn_info.get("is_proxy", False)
        self.is_tor = vpn_info.get("is_tor", False)
        self.vpn_info = vpn_info

        # ================================
        # DEFAULT IP TYPE
        # ================================

        if self.ip_type == "unknown":

            self.ip_type = "residential"
            self.connection_type = "residential"

        # ================================
        # TRAFFIC SOURCE
        # ================================

        query_params = parse_qs(request.url.query)

        if "fbclid" in query_params:
            self.traffic_source = "facebook"
            self.traffic_medium = "paid"

        elif "gclid" in query_params:
            self.traffic_source = "google"
            self.traffic_medium = "paid"

        elif "ttclid" in query_params:
            self.traffic_source = "tiktok"
            self.traffic_medium = "paid"

        elif "utm_source" in query_params:

            self.traffic_source = query_params.get("utm_source")[0]

            if "utm_medium" in query_params:
                self.traffic_medium = query_params.get("utm_medium")[0]

        elif self.referrer:

            ref = self.referrer.lower()

            if "google" in ref:
                self.traffic_source = "google"
                self.traffic_medium = "organic"

            elif "facebook" in ref:
                self.traffic_source = "facebook"
                self.traffic_medium = "social"

            elif "tiktok" in ref:
                self.traffic_source = "tiktok"
                self.traffic_medium = "social"

            elif "bing" in ref:
                self.traffic_source = "bing"
                self.traffic_medium = "organic"

            else:
                self.traffic_source = "referral"
                self.traffic_medium = "referral"

        # ================================
        # HEADER ANOMALY
        # ================================

        if not self.language:
            self.bot_score += 10

        if not self.browser:
            self.bot_score += 10

        if not self.os:
            self.bot_score += 10

        if "headless" in ua_lower:
            self.bot_score += 40

        # ================================
        # ADVANCED FINGERPRINT (ADSPECT+)
        # ================================

        self.canvas_fingerprint = self.request.headers.get("x-canvas-fp")
        self.webgl_fingerprint = self.request.headers.get("x-webgl-fp")
        self.audio_fingerprint = self.request.headers.get("x-audio-fp")
        self.font_fingerprint = self.request.headers.get("x-fonts-fp")

        # 🔥 COMBINED FINGERPRINT
        try:
            fp_raw = f"{self.canvas_fingerprint}|{self.webgl_fingerprint}|{self.audio_fingerprint}|{self.font_fingerprint}"
            self.full_fingerprint = hashlib.sha256(fp_raw.encode()).hexdigest()
        except Exception:
            self.full_fingerprint = None

        # 🔥 STORE IN REDIS (SAFE)
        try:
            if self.ip and self.full_fingerprint:
                redis_client.hset(
                    f"fingerprint:{self.ip}",
                    mapping={
                        "canvas": self.canvas_fingerprint or "",
                        "webgl": self.webgl_fingerprint or "",
                        "audio": self.audio_fingerprint or "",
                        "fonts": self.font_fingerprint or "",
                        "hash": self.full_fingerprint,
                    },
                )
                redis_client.expire(f"fingerprint:{self.ip}", 3600)
        except Exception:
            pass

        # 🔥 BOT SIGNAL (missing fingerprint = suspicious)
        if not self.canvas_fingerprint:
            self.bot_score += 10

        # =========================================
        # 🔥 TRUST SCORE SYSTEM (ADSPECT++ CORE)
        # =========================================
        try:
            trust_key = f"trust:{self.ip}"

            trust = redis_client.get(trust_key)

            if trust:
                trust = int(trust)

                if trust > 5:
                    self.bot_score -= 20

            else:
                redis_client.setex(trust_key, 3600, 1)

        except Exception:
            pass

        # ================================
        # FINAL BOT SCORE
        # ================================

        if self.is_bot and self.bot_score < 80:
            self.bot_score += 30

        if self.device_type == "bot":
            self.bot_score += 20

        if self.bot_score > 100:
            self.bot_score = 100

        # ================================
        # TRAFFIC QUALITY
        # ================================

        if self.bot_score >= 80:
            self.traffic_quality = "fraud"

        elif self.bot_score >= 60:
            self.traffic_quality = "high_risk"

        elif self.bot_score >= 30:
            self.traffic_quality = "medium"

        else:
            self.traffic_quality = "clean"

        # =========================================
        # 🔥 FINAL BOT SCORE NORMALIZATION (FIX)
        # =========================================
        self.bot_score = max(0, min(100, self.bot_score))

        # =========================================
        # 🔥 TRUST LEARNING
        # =========================================
        try:
            if self.traffic_quality == "clean":
                redis_client.incr(f"trust:{self.ip}")
        except Exception:
            pass

        # ================================
        # FINGERPRINT REUSE DETECTION 🔥
        # ================================

        try:
            if self.full_fingerprint:
                key = f"fp_hits:{self.full_fingerprint}"
                hits = redis_client.incr(key)

                if hits == 1:
                    redis_client.expire(key, 300)

                if hits > 15:
                    self.bot_score += 40
        except Exception:
            pass

        # ================================
        # SESSION FINGERPRINT
        # ================================

        self.session_fingerprint = self.generate_session_fingerprint()

        self.visitor_hash = hashlib.sha256(
            f"{self.ip}|{self.user_agent_string}|{self.browser}|{self.os}".encode()
        ).hexdigest()

        # ================================
        # DEBUG LOG
        # ================================

        print("----- VISITOR DEBUG -----")
        print("IP:", self.ip)
        print("Country:", self.country_code)
        print("Device:", self.device_type)
        print("ASN:", self.asn)
        print("Connection:", self.connection_type)
        print("VPN:", self.is_vpn)
        print("Proxy:", self.is_proxy)
        print("Tor:", self.is_tor)
        print("Datacenter:", self.is_datacenter)
        print("Automation:", self.is_automation)
        print("Bot Score:", self.bot_score)
        print("Quality:", self.traffic_quality)
        print("------------------------")

    # ================================
    # SESSION FINGERPRINT
    # ================================

    def generate_session_fingerprint(self):

        raw = f"{self.user_agent_string}|{self.language}|{self.host}"

        return hashlib.sha256(raw.encode()).hexdigest()


# ================================
# SIMPLE FINGERPRINT
# ================================


def get_fingerprint(request: Request):

    ip = request.client.host if request.client else "0.0.0.0"
    ua = request.headers.get("user-agent", "")

    raw = f"{ip}|{ua}"

    return hashlib.sha256(raw.encode()).hexdigest()
