from app.services.redis_client import redis_client


class BotClassifier:

    def __init__(self, visitor):
        self.visitor = visitor
        self.score = 0

    def calculate(self):
        ip = getattr(self.visitor, "ip", None)

        # -----------------------------
        # 1. BEHAVIOR ANALYSIS (SAFE)
        # -----------------------------
        try:
            if ip:
                behavior = redis_client.hgetall(f"behavior:{ip}") or {}

                mouse = int(behavior.get("mouse_moves", 0) or 0)
                scroll = int(behavior.get("scrolls", 0) or 0)
                clicks = int(behavior.get("clicks", 0) or 0)

                # weak interaction
                if mouse < 3:
                    self.score += 20

                if scroll == 0:
                    self.score += 10

                if clicks == 0:
                    self.score += 10

                # zero interaction = high risk
                if mouse == 0 and scroll == 0 and clicks == 0:
                    self.score += 25

            else:
                self.score += 15

        except Exception:
            self.score += 5  # fallback safety

        # -----------------------------
        # 2. USER AGENT (ADVANCED)
        # -----------------------------
        ua = (getattr(self.visitor, "user_agent_string", "") or "").lower()

        bot_keywords = [
            "bot",
            "crawl",
            "spider",
            "facebook",
            "preview",
            "python",
            "curl",
            "wget",
            "postman",
            "headless",
            "phantom",
            "selenium",
        ]

        if any(k in ua for k in bot_keywords):
            self.score += 35

        # suspicious UA length
        if len(ua) < 20:
            self.score += 10

        # -----------------------------
        # 3. DEVICE CHECK
        # -----------------------------
        if getattr(self.visitor, "device_type", "") == "bot":
            self.score += 40

        # -----------------------------
        # 4. DATACENTER / PROXY
        # -----------------------------
        if getattr(self.visitor, "is_datacenter", False):
            self.score += 25

        if getattr(self.visitor, "is_proxy", False):
            self.score += 20

        # -----------------------------
        # 5. VELOCITY CHECK (NEW 🔥)
        # -----------------------------
        try:
            if ip:
                key = f"req_count:{ip}"
                count = redis_client.incr(key)

                if count == 1:
                    redis_client.expire(key, 60)

                if count > 30:  # 30 requests/min = suspicious
                    self.score += 30

        except Exception:
            pass

        # -----------------------------
        # 6. BOT SCORE (EXTERNAL)
        # -----------------------------
        bot_score = getattr(self.visitor, "bot_score", 0) or 0

        if bot_score >= 80:
            self.score += 35
        elif bot_score >= 50:
            self.score += 15

        # -----------------------------
        # 7. HEADLESS DETECTION (BASIC)
        # -----------------------------
        if "headless" in ua or "phantomjs" in ua:
            self.score += 40

        # -----------------------------
        # NORMALIZE
        # -----------------------------
        self.score = max(0, min(self.score, 100))

        return self.score

    def classify(self):
        score = self.calculate()

        if score >= 70:
            return "bot"
        elif score >= 40:
            return "suspicious"
        return "human"
