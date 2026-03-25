import time
from services.redis_client import redis_client


class ClickFraudEngine:

    def __init__(self, visitor):

        self.visitor = visitor
        self.ip = visitor.ip
        self.fingerprint = visitor.session_fingerprint

    # =====================================
    # MAIN FRAUD CHECK
    # =====================================

    def calculate(self):

        score = 0

        score += self.check_ip_velocity()
        score += self.check_fingerprint_velocity()
        score += self.check_click_burst()

        return score

    # =====================================
    # IP VELOCITY
    # =====================================

    def check_ip_velocity(self):

        key = f"fraud:ip:{self.ip}"

        clicks = redis_client.incr(key)

        redis_client.expire(key, 60)

        if clicks > 20:
            return 50

        if clicks > 10:
            return 30

        if clicks > 5:
            return 10

        return 0

    # =====================================
    # FINGERPRINT VELOCITY
    # =====================================

    def check_fingerprint_velocity(self):

        key = f"fraud:fp:{self.fingerprint}"

        clicks = redis_client.incr(key)

        redis_client.expire(key, 60)

        if clicks > 15:
            return 40

        if clicks > 8:
            return 20

        return 0

    # =====================================
    # CLICK BURST DETECTION
    # =====================================

    def check_click_burst(self):

        key = f"fraud:burst:{self.ip}"

        now = int(time.time())

        last = redis_client.get(key)

        redis_client.setex(key, 10, now)

        if last:

            delta = now - int(last)

            if delta < 1:
                return 50

            if delta < 3:
                return 20

        return 0

    # =====================================
    # FRAUD DECISION
    # =====================================

    def is_fraud(self):

        score = self.calculate()

        return score >= 60
