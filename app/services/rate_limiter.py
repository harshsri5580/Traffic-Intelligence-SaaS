from services.redis_client import redis_client
import time


# ======================================
# RATE LIMIT SETTINGS
# ======================================

WINDOW_SECONDS = 60
MAX_REQUESTS = 100


# ======================================
# RATE LIMIT CHECK
# ======================================


def check_rate_limit(ip: str):

    try:

        key = f"rate:{ip}"

        current = redis_client.incr(key)

        # first request → start window
        if current == 1:
            redis_client.expire(key, WINDOW_SECONDS)

        # limit exceeded
        if current > MAX_REQUESTS:
            return False

        return True

    except Exception:
        # Redis failure fallback → allow request
        return True


# ======================================
# ADVANCED RATE LIMIT (FUTURE)
# ======================================


def check_rate_limit_advanced(ip: str, limit: int = 100, window: int = 60):

    try:

        key = f"rate:{ip}:{int(time.time() / window)}"

        current = redis_client.incr(key)

        redis_client.expire(key, window)

        if current > limit:
            return False

        return True

    except Exception:

        return True
