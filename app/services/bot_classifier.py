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
                if mouse < 2:
                    self.score += 10

                if scroll == 0:
                    self.score += 8

                if clicks == 0:
                    self.score += 8

                # strong signal only if EVERYTHING zero
                if mouse == 0 and scroll == 0 and clicks == 0:
                    self.score += 20

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

        if any(k in ua for k in bot_keywords):
            self.score += 25  # reduced (avoid false positives)

        # suspicious UA patterns
        if len(ua) < 20:
            self.score += 8

        if "mozilla" not in ua:
            self.score += 10

        # -----------------------------
        # 3. DEVICE CHECK
        # -----------------------------
        if getattr(self.visitor, "device_type", "") == "bot":
            self.score += 35

        # -----------------------------
        # 4. NETWORK QUALITY
        # -----------------------------
        if getattr(self.visitor, "is_datacenter", False):
            self.score += 30  # stronger

        if getattr(self.visitor, "is_proxy", False):
            self.score += 25

        if getattr(self.visitor, "is_vpn", False):
            self.score += 20

        # -----------------------------
        # 5. VELOCITY CHECK (IMPROVED)
        # -----------------------------
        try:
            if ip:
                key = f"req_count:{ip}"
                count = redis_client.incr(key)

                if count == 1:
                    redis_client.expire(key, 60)

                if count > 20:
                    self.score += 15

                if count > 50:
                    self.score += 30

        except Exception:
            pass

        # -----------------------------
        # 6. EXTERNAL BOT SCORE
        # -----------------------------
        bot_score = getattr(self.visitor, "bot_score", 0) or 0

        if bot_score >= 80:
            self.score += 30
        elif bot_score >= 50:
            self.score += 12

        # -----------------------------
        # 7. HEADLESS + AUTOMATION SIGNAL
        # -----------------------------
        if "headless" in ua or "phantomjs" in ua:
            self.score += 35

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
            self.score *= 0.7

        # -----------------------------
        # NORMALIZE
        # -----------------------------
        self.score = max(0, min(int(self.score), 100))

        return self.score

    def classify(self):
        score = self.calculate()

        if score >= 75:
            return "bot"
        elif score >= 45:
            return "suspicious"
        return "human"
