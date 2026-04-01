import json

from app.services.redis_client import redis_client
from app.services.proxy_rotation_detector import detect_proxy_rotation
from app.services.ip_reputation import get_ip_reputation, set_ip_reputation


class RiskEngine:

    def __init__(self, visitor, campaign=None):
        self.visitor = visitor
        self.campaign = campaign
        self.score = 0

    # =========================================
    # MAIN RISK CALCULATION
    # =========================================

    def calculate(self):

        ip = getattr(self.visitor, "ip", None)

        if not ip:
            return 0

        # ---------------------------------
        # LOCAL BYPASS (SAFE)
        # ---------------------------------
        # 🔥 LOCAL + DEV SAFE MODE (ZERO FALSE BLOCK)
        DEV_IPS = ["127.0.0.1", "103.46.203.161"]

        if ip in DEV_IPS:
            return 0
        # ---------------------------------
        # BLOCKED CACHE
        # ---------------------------------
        try:
            if redis_client.get(f"blocked_ip:{ip}"):
                return 100
        except Exception:
            pass

        # ---------------------------------
        # PROXY ROTATION
        # ---------------------------------
        try:
            if (
                detect_proxy_rotation(self.visitor)
                and getattr(self.visitor, "ip_type", "") != "residential"
            ):
                if not self.campaign or getattr(
                    self.campaign, "block_proxy_rotation", True
                ):
                    self.score += 70
        except Exception:
            pass

        # ---------------------------------
        # BOT SCORE
        # ---------------------------------
        bot_score = getattr(self.visitor, "bot_score", 0) or 0

        if bot_score >= 80:
            self.score += 60
        elif bot_score >= 60:
            self.score += 40
        elif bot_score >= 40:
            self.score += 20

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
        # DATACENTER
        # ---------------------------------
        if getattr(self.visitor, "is_datacenter", False):
            self.score += 40

        # ---------------------------------
        # VPN / PROXY (SAFE CACHE)
        # ---------------------------------
        try:
            cache_key = f"vpn:{ip}"
            cached = redis_client.get(cache_key)

            if cached:
                vpn_info = json.loads(cached)
            else:
                vpn_info = getattr(self.visitor, "vpn_info", None)
                if vpn_info:
                    redis_client.setex(cache_key, 3600, json.dumps(vpn_info))

            if vpn_info:
                if vpn_info.get("is_tor"):
                    self.score += 60
                if vpn_info.get("is_vpn"):
                    self.score += 40
                if vpn_info.get("is_proxy"):
                    self.score += 30
                if vpn_info.get("is_residential_proxy"):
                    self.score += 20

        except Exception:
            pass

        # ---------------------------------
        # IP REPUTATION
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
        # BEHAVIOR ANALYSIS
        # ---------------------------------
        try:
            behavior = redis_client.hgetall(f"behavior:{ip}") or {}

            mouse = int(behavior.get("mouse_moves", 0) or 0)
            scroll = int(behavior.get("scrolls", 0) or 0)
            clicks = int(behavior.get("clicks", 0) or 0)

            # 🔥 ONLY APPLY IF DATA EXISTS
            if behavior:

                if mouse < 3:
                    self.score += 5

                if scroll == 0 and mouse > 0:
                    self.score += 5

                if clicks == 0 and mouse > 2:
                    self.score += 5

                if mouse == 0 and scroll == 0 and clicks == 0:
                    self.score += 10

        except Exception:
            pass

        # ---------------------------------
        # FINGERPRINT ANALYSIS
        # ---------------------------------
        try:
            fp = redis_client.hgetall(f"fingerprint:{ip}") or {}

            if fp:
                if fp.get("webdriver") == "true":
                    self.score += 50

                if fp.get("screen") == "0x0":
                    self.score += 25

                if not fp.get("platform"):
                    self.score += 5

        except Exception:
            pass

        # ---------------------------------
        # CANVAS REUSE DETECTION
        # ---------------------------------
        try:
            canvas = getattr(self.visitor, "canvas_fingerprint", None)

            if canvas:
                key = f"canvas:{canvas}"
                hits = redis_client.incr(key)

                if hits == 1:
                    redis_client.expire(key, 300)

                if hits > 10:
                    self.score += 35

        except Exception:
            pass

        # ---------------------------------
        # RATE LIMIT
        # ---------------------------------
        try:
            key = f"click_rate:{ip}"
            hits = redis_client.incr(key)

            if hits == 1:
                redis_client.expire(key, 10)

            if hits > 200:
                self.score += 10

        except Exception:
            pass

        # ---------------------------------
        # RETURNING USER BONUS
        # ---------------------------------
        if getattr(self.visitor, "is_returning", False):
            self.score -= 10

        # ---------------------------------
        # NORMALIZE
        # ---------------------------------
        self.score = max(0, min(self.score, 100))

        # ---------------------------------
        # CACHE HIGH RISK
        # ---------------------------------
        try:
            if self.score >= 90:
                redis_client.setex(f"blocked_ip:{ip}", 120, "1")
        except Exception:
            pass

        # ---------------------------------
        # AUTO LEARNING (FIXED ✅)
        # ---------------------------------
        try:
            current = get_ip_reputation(ip)

            if self.score >= 80:
                new_score = min(current + 20, 100)
            elif self.score >= 50:
                new_score = min(current + 10, 100)
            elif self.score < 20:
                new_score = max(current - 5, 0)
            else:
                new_score = current

            set_ip_reputation(ip, new_score)

        except Exception:
            pass

        return self.score

    # =========================================
    # HIGH RISK CHECK
    # =========================================

    def is_high_risk(self):
        return self.calculate() >= 70
