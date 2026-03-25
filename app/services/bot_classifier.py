from app.services.redis_client import redis_client


class BotClassifier:

    def __init__(self, visitor):
        self.visitor = visitor
        self.score = 0

    def calculate(self):

        ip = self.visitor.ip

        # -----------------------------
        # 1. BEHAVIOR ANALYSIS
        # -----------------------------
        try:
            behavior = redis_client.hgetall(f"behavior:{ip}")

            if behavior:
                mouse = int(behavior.get("mouse_moves", 0))
                scroll = int(behavior.get("scrolls", 0))
                clicks = int(behavior.get("clicks", 0))

                if mouse < 5:
                    self.score += 25

                if scroll == 0:
                    self.score += 15

                if clicks == 0:
                    self.score += 15

                if mouse == 0 and scroll == 0:
                    self.score += 30

            else:
                self.score += 10

        except Exception:
            pass

        # -----------------------------
        # 2. USER AGENT CHECK
        # -----------------------------
        ua = (self.visitor.user_agent_string or "").lower()

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
        ]

        if any(k in ua for k in bot_keywords):
            self.score += 40

        # -----------------------------
        # 3. DEVICE CHECK
        # -----------------------------
        if self.visitor.device_type == "bot":
            self.score += 40

        # -----------------------------
        # 4. DATACENTER CHECK
        # -----------------------------
        if getattr(self.visitor, "is_datacenter", False):
            self.score += 30

        # -----------------------------
        # 5. BOT SCORE (existing)
        # -----------------------------
        bot_score = getattr(self.visitor, "bot_score", 0)

        if bot_score >= 80:
            self.score += 40
        elif bot_score >= 50:
            self.score += 20

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
