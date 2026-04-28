import hashlib
from fastapi import Request
from user_agents import parse
import random
from urllib.parse import parse_qs
import json
from app.services.redis_client import redis_client
from app.services.learning_engine import get_ai_risk
from app.services.geo import get_geo_data, get_asn_data


class VisitorContext:

    def __init__(self, request: Request):

        self.request = request
        self.reasons = []

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

        self.user_agent_string = (
            headers.get("user-agent") or headers.get("User-Agent") or ""
        )
        self.referrer = (
            headers.get("referer")
            or headers.get("origin")
            or headers.get("referrer")
            or ""
        )
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
            self.bot_score += 40
            self.reasons.append("automation_detected")
        # 🔥 AUTOMATION HARD FORCE
        if self.is_automation:
            self.bot_score = max(self.bot_score, 80)

        if any(k in ua_lower for k in bot_keywords):

            self.is_bot = True
            self.device_type = "bot"
            self.bot_score += 60
            self.reasons.append("bot_user_agent")

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
                tz = geo.get("timezone")

                # 🔥 VALIDATE TIMEZONE
                if tz and "/" in tz:
                    self.ip_timezone = tz
                else:
                    self.ip_timezone = "UTC"
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

        dc_asn_keywords = [
            # 🌐 BIG CLOUD (HIGH CONFIDENCE)
            "amazon",
            "aws",
            "google",
            "gcp",
            "microsoft",
            "azure",
            "oracle",
            "cloudflare",
            "akamai",
            "fastly",
            # 🏢 MAJOR VPS / HOSTING
            "digitalocean",
            "linode",
            "vultr",
            "ovh",
            "hetzner",
            "contabo",
            "scaleway",
            "leaseweb",
            "choopa",
            "buyvm",
            "ramnode",
            "frantech",
            # 🌍 CDN / EDGE / INFRA
            "cdn",
            "edge",
            "anycast",
            "cache",
            # 🧠 PROXY / VPN NETWORKS (STRONG SIGNAL)
            "vpn",
            "proxy",
            "tunnel",
            "anonymous",
            "nordvpn",
            "expressvpn",
            "surfshark",
            "ipvanish",
            "protonvpn",
            # 🧪 RESIDENTIAL PROXY NETWORKS
            "luminati",
            "brightdata",
            "oxylabs",
            "smartproxy",
            "soax",
            "netnut",
            "packetstream",
            "honeygain",
            # 🌏 ASIA CLOUD (SAFE TO KEEP)
            "alibaba",
            "tencent",
            "huawei",
            # ⚠️ KNOWN ABUSE / MIXED INFRA
            "zenlayer",
            "xtom",
            "multacom",
            "psychz",
            "quadranet",
            "path network",
            "path.net",
            # ⚠️ YOUR CUSTOM (FIXED CASE)
            "waicore",
        ]

        if self.org:
            org_lower = self.org.lower()

            if any(k in org_lower for k in dc_asn_keywords):
                self.is_datacenter = True
                # self.bot_score = max(self.bot_score, 70)
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
        # 🔥 FINAL DATACENTER DETECTION (CLEAN + STRONG)
        # ================================

        org_lower = (self.org or "").lower()
        isp_lower = (self.isp or "").lower()

        # 🔥 MASTER KEYWORDS (SHORT + MATCHABLE)
        dc_keywords = [
            # 🌐 BIG CLOUD
            "amazon",
            "aws",
            "google",
            "gcp",
            "microsoft",
            "azure",
            "oracle",
            "cloudflare",
            "akamai",
            "fastly",
            # 🏢 VPS / HOSTING
            "digitalocean",
            "linode",
            "waicore",
            "vultr",
            "ovh",
            "hetzner",
            "contabo",
            "scaleway",
            "leaseweb",
            "colo",
            "datacenter",
            "hosting",
            "server",
            "dedicated",
            # 🌍 CDN / EDGE
            "cdn",
            "edge",
            "cache",
            "anycast",
            # 🧠 VPN / PROXY NETWORKS
            "vpn",
            "proxy",
            "anonymous",
            "tunnel",
            "nordvpn",
            "expressvpn",
            "surfshark",
            "ipvanish",
            # 🧪 RESIDENTIAL PROXY NETWORKS
            "datacamp",
            "packetstream",
            "honeygain",
            "luminati",
            "brightdata",
            "smartproxy",
            "oxylabs",
            "soax",
            "netnut",
            # 🌏 ASIA CLOUD / MIXED
            "alibaba",
            "tencent",
            "huawei",
            "baidu",
            # 🇪🇺 EU HOSTING / DC
            "m247",
            "worldstream",
            "private layer inc",
            "psychz",
            "online",
            # ⚠️ HARD TARGETS (IMPORTANT)
            # "biglobe",
            "arteria",
            # "k-opticom",
            "akari",
            "it7",
            "softether",
            "cogent",
            "zenlayer",
            "hosthatch",
            "hydra",
            "gsl",
            "quxlabs",
            "skyspark",
            "celeste",
            "community",
            "latitude",
            # "starcat",
            # ⚠️ GENERIC INFRA
            "cloud",
            "compute",
            "virtual",
            "vps",
            "instance",
            "proton",
            "big data host",
            "hydra",
            "altushost",
            "netprotect",
            "protonVPN",
            "ipxo",
            "virgin",
            "datasource",
            "dmzhost",
        ]
        # 🔥 NEW ADVANCED SUSPICIOUS ISP KEYWORDS

        dc_keywords += [
            # 🌍 GLOBAL HOSTING / VPS (MORE)
            "choopa",
            "hostwinds",
            "namecheap",
            "interserver",
            "knownhost",
            "liquidweb",
            "inmotion",
            "a2hosting",
            "hostgator",
            "bluehost",
            "dreamhost",
            "rackspace",
            "stackpath",
            "stackpathcdn",
            # 🧠 PROXY / ROTATING NETWORKS
            "911 re",
            "911 proxy",
            "proxyrack",
            "geosurf",
            "shifter",
            "stormproxies",
            "proxyline",
            "proxy6",
            "buyproxies",
            "rsocks",
            "socks5",
            "residential proxy",
            "rotating proxy",
            "backconnect",
            "ip rotation",
            # ⚠️ KNOWN DC / ABUSE NETWORKS
            "path network",
            "path.net",
            "zenlayer",
            "xserver",
            "xtom",
            "frantech",
            "buyvm",
            "ramnode",
            "colo cross",
            "multacom",
            "psychz networks",
            "quadranet",
            "secureserver",
            "godaddy",
            "hosteurope",
            "fasthosts",
            "ukfast",
            # 🇪🇺 EUROPE MIXED NETWORK
            "ovh sas",
            "online sas",
            "scaleway",
            # 🇺🇸 US MIXED / SUSPICIOUS
            "cox business",
            "att services",
            "verizon business",
            # 🌐 GENERIC HIGH-RISK WORDS
            "network solutions",
            "hosting solutions",
            "cloud services",
            "internet services",
        ]

        # 🔥 NORMALIZE FIRST WORD (SUPER IMPORTANT)
        def normalize_word(text):
            if not text:
                return ""
            return text.lower().replace(".", "").replace(",", "").split()[0]

        org_first = normalize_word(self.org)
        isp_first = normalize_word(self.isp)

        # 🔥 FINAL MATCH LOGIC (BOTH FULL + FIRST WORD)
        is_dc_match = (
            any((k in org_lower) or (k in isp_lower) for k in dc_keywords)
            or org_first in dc_keywords
            or isp_first in dc_keywords
        )

        if is_dc_match:
            self.is_datacenter = True
            self.connection_type = "datacenter"
            self.ip_type = "datacenter"

            self.bot_score += 30  # 🔥 increase
            self.reasons.append("datacenter_ip")

        # ================================
        # VPN DETECTION
        # ================================

        if self.org:
            vpn_keywords = ["vpn", "proxy", "hosting", "server"]

            if any(k in self.org.lower() for k in vpn_keywords):
                self.connection_type = "vpn"
                self.is_vpn = True
                self.bot_score += 40  # 🔥 from 15 → 40
                self.reasons.append("vpn_detected")

        # ================================
        # VPN / PROXY / TOR DETECTION
        # ================================

        from app.services.vpn_detector import detect_vpn

        vpn_info = detect_vpn(self.ip, org=self.org, asn=self.asn)

        self.is_vpn = self.is_vpn or vpn_info.get("is_vpn", False)
        self.is_proxy = self.is_proxy or vpn_info.get("is_proxy", False)
        self.is_tor = self.is_tor or vpn_info.get("is_tor", False)

        # 🔥 HARD BOT BOOST (DC / PROXY / TOR)

        if self.is_tor:
            self.bot_score = max(self.bot_score, 95)
            self.reasons.append("tor_network")

        elif self.is_proxy:
            self.bot_score = max(self.bot_score, 70)
            self.reasons.append("proxy_network")

        elif self.is_datacenter:
            self.bot_score = max(self.bot_score, 60)
            self.reasons.append("datacenter_network")
        # ================================
        # 🔥 UNKNOWN NETWORK BOOST (ADD HERE)
        # ================================

        if self.connection_type == "unknown" and self.bot_score > 30:
            self.bot_score += 10
        # ================================
        # DEFAULT IP TYPE
        # ================================

        if self.ip_type == "unknown":

            self.ip_type = "residential"
            self.connection_type = "residential"
            # 🔥 REAL USER SAFE (RESIDENTIAL)
            # if self.connection_type == "residential" and not self.is_automation:
            #     if self.bot_score < 80:
            #         self.bot_score *= 0.6
            # 🔥 SAFE REAL USER PROTECTION (SMART)
            if (
                self.connection_type == "residential"
                and not self.is_vpn
                and not self.is_proxy
                and not self.is_datacenter
                and not self.is_automation
            ):
                if self.bot_score < 70:
                    self.bot_score *= 0.7

        # ================================
        # 🔥 REAL USER HARD PROTECTION
        # ================================

        if (
            self.connection_type == "residential"
            and not self.is_vpn
            and not self.is_proxy
            and not self.is_datacenter
            and not self.is_automation
        ):
            if self.bot_score < 60:
                self.bot_score *= 0.5
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

        elif self.referrer and len(self.referrer) > 5:

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

        if not self.language and not self.is_datacenter:
            self.bot_score += 5

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
        missing_fp = 0

        if not self.canvas_fingerprint:
            missing_fp += 1
        if not self.webgl_fingerprint:
            missing_fp += 1
        if not self.audio_fingerprint:
            missing_fp += 1

        if missing_fp >= 3:
            self.bot_score += 20
            self.reasons.append("fp_missing")

        # =========================================
        # 🔥 TRUST SCORE SYSTEM (ADSPECT++ CORE)
        # =========================================
        try:
            trust_key = f"trust:{self.ip}"

            trust = redis_client.get(trust_key)

            if trust:
                trust = int(trust)

                if trust > 5 and self.traffic_quality == "clean":
                    self.bot_score -= 10

            else:
                redis_client.setex(trust_key, 3600, 1)

        except Exception:
            pass
        # 🔥 FORCE HIGH SCORE FOR DATACENTER
        if self.is_datacenter:
            self.bot_score = max(self.bot_score, 40)

        # ================================
        # 🔥 AI RISK BOOST (SAFE VERSION)
        # ================================

        try:
            ai_risk = get_ai_risk(self)

            # 🔥 ignore low confidence data
            if ai_risk < 20:
                pass

            # 🔥 medium risk (safe boost)
            elif ai_risk < 50:
                self.bot_score += 5

            # 🔥 high risk (controlled boost)
            elif ai_risk < 70:
                self.bot_score += 5

            # 🔥 very high risk (but still safe)
            else:
                self.bot_score += 15

        except:
            pass

        # ================================
        # 🛡️ TRUSTED ISP SAFE GUARD
        # ================================

        trusted_isp = [
            # 🇮🇳 INDIA
            "jio",
            "airtel",
            "vodafone idea",
            "asahi",
            "optage",
            "qtnet",
            "jcom",
            "chubu",
            "ntt",
            "kddi",
            "vi",
            "bsnl",
            "act fibernet",
            "hathway",
            # 🇺🇸 USA
            "comcast",
            "xfinity",
            "verizon",
            "att",
            "at&t",
            "spectrum",
            "charter",
            "cox",
            "frontier",
            "centurylink",
            # 🇬🇧 UK
            "bt",
            "british telecom",
            "virgin media",
            "sky broadband",
            "talktalk",
            # 🇪🇺 EUROPE (major)
            "orange",
            "telefonica",
            "o2",
            "vodafone",
            "deutsche telekom",
            "telekom",
            "t-mobile",
            "bouygues",
            "free sas",
            "iliad",
            "proximus",
            "kpn",
            "ziggo",
            "telia",
            "telenor",
            "tele2",
            # 🇯🇵 JAPAN
            "ntt",
            "ntt docomo",
            "softbank",
            "kddi",
            "au",
            "rakuten",
            # 🇰🇷 KOREA
            "kt corporation",
            "sk telecom",
            "lg uplus",
            # 🇨🇳 CHINA (mixed but big)
            "china telecom",
            "china unicom",
            "china mobile",
            # 🇸🇬 / 🇦🇺 ASIA PACIFIC
            "singtel",
            "starhub",
            "m1",
            "telstra",
            "optus",
            "tpg",
            # 🌍 MIDDLE EAST
            "etisalat",
            "du",
            "stc",
            "zain",
            "ooredoo",
            "mobily",
            "batelco",
            # 🌍 AFRICA
            "mtn",
            "airtel africa",
            "vodacom",
            "safaricom",
            "biglobe",
            "k-opticom",
            "matsusaka",
            "ocn",
            "open computer network",
            "starcat",
            "stnet",
            "koshinomiyako",
            "community network center",
        ]

        if self.isp and any(t in self.isp.lower() for t in trusted_isp):
            self.bot_score -= 30

        # ================================
        # 🔥 CONFIDENCE SYSTEM (VERY IMPORTANT)
        # ================================

        signals = 0

        if self.is_datacenter:
            signals += 1
        if self.is_proxy:
            signals += 1
        if self.is_vpn:
            signals += 1
        if self.is_tor:
            signals += 1
        if self.is_automation:
            signals += 1
        if self.bot_score > 70:
            signals += 1

        self.signal_strength = signals

        # 🔥 weak signal → reduce score
        if signals <= 1 and self.bot_score < 80:
            self.bot_score *= 0.7

        # 🔥 strong signal → boost
        if signals >= 3:
            self.bot_score += 15
        # ================================
        # 🔥 MICRO VARIATION (ANTI PATTERN)
        # ================================

        import random
        import time

        # small random noise
        if self.signal_strength >= 2 or self.bot_score >= 30:
            self.bot_score += random.randint(0, 3)
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

                if hits > 10:
                    self.bot_score += 35
                    self.reasons.append("fp_abuse")
        except Exception:
            pass

        # ================================
        # 🔥 FINGERPRINT REPEAT DETECTION
        # ================================

        if hasattr(self, "fingerprint"):
            key = f"fp:{self.fingerprint}"

            count = redis_client.incr(key)
            redis_client.expire(key, 60)

            if count > 3:
                self.bot_score += 15

        # ================================
        # SESSION FINGERPRINT
        # ================================

        self.session_fingerprint = self.generate_session_fingerprint()

        self.visitor_hash = hashlib.sha256(
            f"{self.ip}|{self.user_agent_string}|{self.browser}|{self.os}".encode()
        ).hexdigest()

        # 🔥 SESSION VARIATION
        # session_seed = hash(self.session_fingerprint) % 10
        # self.bot_score += session_seed
        # ================================
        # 🔥 FINAL SAFETY CHECK
        # ================================

        if self.signal_strength <= 1 and self.bot_score > 70:
            self.bot_score = 55  # 🔥 avoid false block

        # =========================================
        # 🔥 FINAL BOT SCORE NORMALIZATION (FINAL STEP)
        # =========================================
        self.bot_score = int(max(0, min(100, self.bot_score)))

        # 🔥 BREAK STATIC PATTERN
        if self.bot_score > 0:
            self.bot_score += self.bot_score % 3
        # ================================
        # DEBUG LOG
        # ================================

        # print("----- VISITOR DEBUG -----")
        # print("IP:", self.ip)
        # print("Country:", self.country_code)
        # print("Device:", self.device_type)
        # print("ASN:", self.asn)
        # print("Connection:", self.connection_type)
        # print("VPN:", self.is_vpn)
        # print("Proxy:", self.is_proxy)
        # print("Tor:", self.is_tor)
        # print("Datacenter:", self.is_datacenter)
        # print("Automation:", self.is_automation)
        # print("Bot Score:", self.bot_score)
        # print("Quality:", self.traffic_quality)
        # print("------------------------")

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
