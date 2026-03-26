import json

from app.services.redis_client import redis_client
from app.services.vpn_detector import detect_vpn
from app.services.proxy_rotation_detector import detect_proxy_rotation
from app.services.ip_reputation import get_ip_reputation, increase_ip_risk


class RiskEngine:

    def __init__(self, visitor, campaign=None):

        self.visitor = visitor
        self.campaign = campaign
        self.score = 0

    # =========================================
    # MAIN RISK CALCULATION
    # =========================================

    def calculate(self):

        ip = self.visitor.ip

        if not ip:
            return 0
        # ❌ DELETE THIS
        if ip in {"127.0.0.1", "103.46.203.161"}:
            return 0

        # ---------------------------------
        # PROXY ROTATION DETECTION
        # ---------------------------------

        try:

            proxy_rotation = detect_proxy_rotation(self.visitor)

            if proxy_rotation:

                # print("PROXY ROTATION DETECTED")

                if not self.campaign or getattr(
                    self.campaign, "block_proxy_rotation", True
                ):

                    self.score += 80

        except Exception:
            pass
        # ---------------------------------
        # HIGH RISK IP CACHE
        # ---------------------------------

        if redis_client.get(f"blocked_ip:{ip}"):

            return 100

        # ---------------------------------
        # COUNTRY RISK
        # ---------------------------------

        high_risk_countries = {
            "RU",
            "CN",
            "VN",
            "BD",
            "PK",
        }

        if getattr(self.visitor, "country_code", "") in high_risk_countries:

            self.score += 20

        # ---------------------------------
        # BOT SCORE FROM VISITOR
        # ---------------------------------

        bot_score = getattr(self.visitor, "bot_score", 0)

        if bot_score:

            if bot_score >= 80:
                self.score += 70

            elif bot_score >= 60:
                self.score += 50

            elif bot_score >= 40:
                self.score += 30
        # ---------------------------------
        # TRAFFIC QUALITY
        # ---------------------------------

        quality = getattr(self.visitor, "traffic_quality", None)

        if quality == "fraud":
            self.score += 50

        elif quality == "high_risk":
            self.score += 30

        elif quality == "medium":
            self.score += 10

        # ---------------------------------
        # DATACENTER DETECTION
        # ---------------------------------

        if getattr(self.visitor, "is_datacenter", False):
            if not self.campaign or getattr(self.campaign, "block_datacenter", True):

                self.score += 40

        datacenter_asn = {
            "AS16509",  # AWS
            "AS15169",  # Google
            "AS14061",  # DigitalOcean
            "AS16276",  # OVH
            "AS24940",  # Hetzner
            "AS13335",  # Cloudflare
            "AS8075",  # Microsoft
        }

        if getattr(self.visitor, "asn", None) in datacenter_asn:

            self.score += 35

        # ---------------------------------
        # VPN / PROXY DETECTION
        # ---------------------------------

        try:

            cache_key = f"vpn:{ip}"

            cached = redis_client.get(cache_key)

            if cached:

                vpn_info = json.loads(cached)

            else:

                vpn_info = getattr(self.visitor, "vpn_info", None)

                redis_client.setex(cache_key, 3600, json.dumps(vpn_info))

            if vpn_info:

                if vpn_info.get("is_tor"):
                    if not self.campaign or getattr(self.campaign, "block_tor", True):
                        self.score += 60

                if vpn_info.get("is_vpn"):
                    if not self.campaign or getattr(self.campaign, "block_vpn", True):
                        self.score += 40

                if vpn_info.get("is_proxy"):
                    if not self.campaign or getattr(self.campaign, "block_proxy", True):
                        self.score += 30

                if vpn_info.get("is_residential_proxy"):
                    self.score += 25

        except Exception:
            pass

        # ---------------------------------
        # IP REPUTATION CHECK
        # ---------------------------------

        try:

            reputation = get_ip_reputation(ip)

            if reputation >= 80:

                self.score += 50

            elif reputation >= 50:

                self.score += 25

        except Exception:
            pass

        # ---------------------------------
        # USER AGENT ANOMALY
        # ---------------------------------

        browser = getattr(self.visitor, "browser", None)
        os = getattr(self.visitor, "os", None)

        if not browser or not os:

            self.score += 20

        # ---------------------------------
        # LANGUAGE ANOMALY
        # ---------------------------------

        lang = getattr(self.visitor, "language", None)

        if not lang:

            self.score += 3

        # ---------------------------------
        # HEADLESS DETECTION
        # ---------------------------------

        ua = getattr(self.visitor, "user_agent_string", "").lower()

        headless_keywords = [
            "headless",
            "phantom",
            "selenium",
            "puppeteer",
            "playwright",
        ]

        if getattr(self.visitor, "is_automation", False):
            if not self.campaign or getattr(self.campaign, "block_automation", True):

                self.score += 40

        # ---------------------------------
        # BEHAVIOR ANALYSIS
        # ---------------------------------

        try:

            behavior = redis_client.hgetall(f"behavior:{ip}")

            if behavior:

                mouse = int(behavior.get("mouse_moves", 0))
                scrolls = int(behavior.get("scrolls", 0))
                clicks = int(behavior.get("clicks", 0))

                try:
                    behavior = redis_client.hgetall(f"behavior:{ip}")

                    if behavior:
                        mouse = int(behavior.get("mouse_moves", 0))
                        scrolls = int(behavior.get("scrolls", 0))
                        clicks = int(behavior.get("clicks", 0))

                        # 🔥 HUMAN vs BOT ANALYSIS

                        if mouse < 5:
                            self.score += 20  # bot-like

                        if scrolls == 0:
                            self.score += 10

                        if clicks == 0:
                            self.score += 10

                        # 🔥 STRONG BOT SIGNAL
                        if mouse == 0 and scrolls == 0:
                            self.score += 30

                    else:
                        # no behavior data
                        self.score += 5

                except Exception:
                    pass

            else:

                self.score += 2

        except Exception:
            pass

        # ---------------------------------
        # FINGERPRINT ANALYSIS
        # ---------------------------------

        try:

            fp = redis_client.hgetall(f"fingerprint:{ip}")

            if fp:

                hardware = int(fp.get("hardware", 0))
                screen = fp.get("screen", "")
                platform = fp.get("platform", "")
                webdriver = fp.get("webdriver", "false")

                if hardware == 0:
                    self.score += 5

                if screen == "0x0":
                    self.score += 25

                if not platform:
                    self.score += 2

                if webdriver == "true":
                    self.score += 50

        except Exception:
            pass

        # ---------------------------------

        # CANVAS FINGERPRINT CHECK
        # ---------------------------------

        canvas_fp = getattr(self.visitor, "canvas_fingerprint", None)

        if canvas_fp:

            key = f"canvas:{canvas_fp}"

            hits = redis_client.incr(key)

            redis_client.expire(key, 300)

            if hits > 10:
                if not self.campaign or getattr(self.campaign, "block_canvas", True):

                    self.score += 40

        # ---------------------------------
        # DEVICE TYPE CHECK
        # ---------------------------------

        if getattr(self.visitor, "device_type", "") == "bot":

            self.score += 30

        # ---------------------------------
        # RETURNING VISITOR BONUS
        # ---------------------------------

        if getattr(self.visitor, "is_returning", False):

            self.score -= 10

        # ---------------------------------

        # RATE LIMIT DETECTION
        # ---------------------------------

        try:

            key = f"click_rate:{ip}"

            hits = redis_client.incr(key)

            redis_client.expire(key, 10)

            if hits > 120:

                self.score += 10

        except Exception:
            pass

        # =========================================
        # ✅ ADD HERE (AUTO LEARNING VISITS)
        # =========================================

        try:
            visits = redis_client.incr(f"visits:{ip}")
            redis_client.expire(f"visits:{ip}", 86400)

            if visits > 20 and self.score < 40:
                self.score -= 10

            if visits > 50:
                self.score -= 20

        except Exception:
            pass

        # ---------------------------------
        # NORMALIZE SCORE
        # ---------------------------------

        self.score = max(self.score, 0)

        if self.score > 100:
            self.score = 100

        # ---------------------------------
        # CACHE HIGH RISK IP
        # ---------------------------------

        if self.score >= 90:

            redis_client.setex(f"blocked_ip:{ip}", 120, "1")

        # ---------------------------------
        # AUTO LEARNING (IP REPUTATION UPDATE)
        # ---------------------------------

        try:
            from app.services.ip_reputation import (
                update_ip_reputation,
                get_ip_reputation,
            )

            current = get_ip_reputation(ip)

            if self.score >= 80:
                new_score = min(current + 20, 100)

            elif self.score >= 50:
                new_score = min(current + 10, 100)

            elif self.score < 20:
                new_score = max(current - 5, 0)

            else:
                new_score = current

            update_ip_reputation(ip, new_score)

        except Exception:
            pass

    # =========================================
    # HIGH RISK CHECK
    # =========================================

    def is_high_risk(self):

        score = self.calculate()

        return score >= 70
