import time
from services.redis_client import redis_client


SESSION_TTL = 3600
MAX_CLICKS_PER_SESSION = 20


class SessionEngine:

    def __init__(self, visitor):

        self.visitor = visitor

        self.session_key = f"ti_session:{visitor.visitor_hash}"
        self.ip_key = f"ti_ip:{visitor.ip}"

    # ----------------------------------
    # LOAD SESSION
    # ----------------------------------

    def get_session(self):

        data = redis_client.hgetall(self.session_key)

        if not data:
            return None

        return {k.decode(): v.decode() for k, v in data.items()}

    # ----------------------------------
    # CREATE SESSION
    # ----------------------------------

    def create_session(self):

        session_data = {
            "ip": self.visitor.ip,
            "browser": str(self.visitor.browser),
            "os": str(self.visitor.os),
            "fingerprint": self.visitor.session_fingerprint,
            "created_at": str(int(time.time())),
            "clicks": "1",
        }

        redis_client.hset(self.session_key, mapping=session_data)

        redis_client.expire(self.session_key, SESSION_TTL)

        return session_data

    # ----------------------------------
    # UPDATE SESSION
    # ----------------------------------

    def update_session(self):

        session = self.get_session()

        if not session:

            return self.create_session()

        clicks = int(session.get("clicks", 0)) + 1

        redis_client.hset(self.session_key, "clicks", clicks)

        redis_client.expire(self.session_key, SESSION_TTL)

        return session

    # ----------------------------------
    # SESSION RISK CHECK
    # ----------------------------------

    def evaluate(self):

        session = self.get_session()

        risk_score = 0

        if not session:

            self.create_session()
            return 0

        # -------------------------------
        # IP SWITCH DETECTION
        # -------------------------------

        if session.get("ip") != self.visitor.ip:

            risk_score += 40

        # -------------------------------
        # FINGERPRINT CHANGE
        # -------------------------------

        if session.get("fingerprint") != self.visitor.session_fingerprint:

            risk_score += 30

        # -------------------------------
        # DEVICE CHANGE
        # -------------------------------

        if session.get("browser") != self.visitor.browser:

            risk_score += 10

        if session.get("os") != self.visitor.os:

            risk_score += 10

        # -------------------------------
        # RAPID CLICK DETECTION
        # -------------------------------

        clicks = int(session.get("clicks", 0))

        if clicks > MAX_CLICKS_PER_SESSION:

            risk_score += 30

        # -------------------------------
        # UPDATE SESSION
        # -------------------------------

        self.update_session()

        return risk_score


# ----------------------------------
# SIMPLE SESSION CHECK
# ----------------------------------


def evaluate_session(visitor):

    try:

        engine = SessionEngine(visitor)

        return engine.evaluate()

    except Exception:

        return 0
