from app.services.redis_client import redis_client


class BotClassifier:

    def __init__(self, visitor):
        self.visitor = visitor
        self.score = 0

    def calculate(self):
        ip = getattr(self.visitor, "ip", None)

        # -----------------------------
        # 1. BEHAVIOR ANALYSIS (TUNED)
        # -----------------------------
        try:
            if ip:
                behavior = redis_client.hgetall(f"behavior:{ip}") or {}

                mouse = int(behavior.get("mouse_moves", 0) or 0)
                scroll = int(behavior.get("scrolls", 0) or 0)
                clicks = int(behavior.get("clicks", 0) or 0)

                # softer penalties (avoid real user block)
                interaction_score = 0

                if mouse < 2:
                    interaction_score += 4

                if scroll == 0:
                    interaction_score += 3

                if clicks == 0:
                    interaction_score += 3

                # only suspicious if absolutely dead session
                if mouse == 0 and scroll == 0 and clicks == 0:
                    interaction_score += 10

                self.score += interaction_score

        except Exception:
            self.score += 3  # lighter fallback

        # -----------------------------
        # 2. USER AGENT (IMPROVED)
        # -----------------------------
        ua = (getattr(self.visitor, "user_agent_string", "") or "").lower()

        bot_keywords = [
            "bot",
            "crawl",
            "spider",
            "crawler",
            "slurp",
            "preview",
            "fetch",
            "httpclient",
            "scanner",
            "headless",
            "phantom",
            "selenium",
            "playwright",
            "puppeteer",
            "automation",
            "monitor",
            "checker",
            "python",
            "curl",
            "wget",
            "postman",
            "insomnia",
            "java",
            "libwww",
            "okhttp",
            "go-http-client",
            "axios",
            "scrapy",
            "node-fetch",
        ]

        matched_keywords = [k for k in bot_keywords if k in ua]

        if matched_keywords:

            # severe automation keywords
            hard_keywords = [
                "selenium",
                "playwright",
                "puppeteer",
                "phantom",
                "headless",
                "curl",
                "wget",
                "scrapy",
            ]

            if any(k in matched_keywords for k in hard_keywords):
                self.score += 45
            else:
                self.score += 20  # reduced (avoid false positives)

        # suspicious UA patterns
        if len(ua) < 20 and "mozilla" not in ua:
            self.score += 12

        if "mozilla" not in ua and len(ua) < 40:
            self.score += 10

        # -----------------------------
        # 3. DEVICE CHECK
        # -----------------------------
        if getattr(self.visitor, "device_type", "") == "bot":
            self.score += 30

        # -----------------------------
        # 4. NETWORK QUALITY
        # -----------------------------
        if getattr(self.visitor, "is_datacenter", False):

            if getattr(self.visitor, "signal_strength", 0) >= 2:
                self.score += 65
            else:
                self.score += 25  # stronger

        if getattr(self.visitor, "is_proxy", False):

            if getattr(self.visitor, "signal_strength", 0) >= 2:
                self.score += 48
            else:
                self.score += 16

        if getattr(self.visitor, "is_vpn", False):

            if getattr(self.visitor, "signal_strength", 0) >= 2:
                self.score += 52
            else:
                self.score += 18

        # -----------------------------
        # 5. VELOCITY CHECK (IMPROVED)
        # -----------------------------
        try:
            if ip:
                key = f"req_count:{ip}"
                count = redis_client.incr(key)

                if count == 1:
                    redis_client.expire(key, 60)

                if count > 30:
                    self.score += 10

                if count > 80:
                    self.score += 25

        except Exception:
            pass

        # -----------------------------
        # 6. EXTERNAL BOT SCORE
        # -----------------------------
        bot_score = getattr(self.visitor, "bot_score", 0) or 0

        if bot_score >= 85:
            self.score += 35

        elif bot_score >= 65:
            self.score += 20

        elif bot_score >= 45:
            self.score += 8

        # -----------------------------
        # 7. HEADLESS + AUTOMATION SIGNAL
        # -----------------------------
        if (
            "headless" in ua
            or "phantomjs" in ua
            or "selenium" in ua
            or "playwright" in ua
            or "puppeteer" in ua
        ):
            self.score += 60

        # -----------------------------
        # 8. REAL USER PROTECTION (VERY IMPORTANT)
        # -----------------------------
        if (
            getattr(self.visitor, "connection_type", "") == "residential"
            and not getattr(self.visitor, "is_proxy", False)
            and not getattr(self.visitor, "is_datacenter", False)
            and not getattr(self.visitor, "is_vpn", False)
        ):
            # reduce risk for real users
            if self.score < 45:
                self.score *= 0.50

        # =========================================
        # FINAL HARD RULES
        # =========================================

        if getattr(self.visitor, "is_proxy", False) and getattr(
            self.visitor, "is_datacenter", False
        ):
            self.score = max(self.score, 75)

        if getattr(self.visitor, "is_proxy", False) and (
            "headless" in ua
            or "selenium" in ua
            or "playwright" in ua
            or "puppeteer" in ua
        ):
            self.score = max(self.score, 94)

        if getattr(self.visitor, "is_datacenter", False) and (
            "selenium" in ua or "playwright" in ua or "puppeteer" in ua
        ):
            self.score = max(self.score, 98)
        if getattr(self.visitor, "is_tor", False):
            self.score = 100

        if (
            getattr(self.visitor, "is_proxy", False)
            and getattr(self.visitor, "signal_strength", 0) >= 2
        ):
            self.score = max(self.score, 85)

        import random

        self.score += random.uniform(-2.7, 4.2)
        # -----------------------------
        # NORMALIZE
        # -----------------------------
        self.score = max(0, min(int(self.score), 100))

        return self.score

    def classify(self):
        score = self.calculate()

        if score >= 75:
            return "bot"

        elif score >= 40:
            return "suspicious"

        return "human"
