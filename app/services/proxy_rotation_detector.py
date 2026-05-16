import time
from app.services.redis_client import redis_client

MAX_IPS_PER_DEVICE = 5
WINDOW_SECONDS = 600
MIN_ROTATION_TIME = 15


def detect_proxy_rotation(visitor):

    try:

        fingerprint = getattr(visitor, "session_fingerprint", None)
        ip = getattr(visitor, "ip", None)

        if not fingerprint or not ip:
            return False

        # =========================================
        # SAFE USER PROTECTION
        # =========================================

        if getattr(visitor, "ip_type", "") == "residential":

            if (
                not getattr(visitor, "is_vpn", False)
                and not getattr(visitor, "is_proxy", False)
                and not getattr(visitor, "is_datacenter", False)
            ):
                return False

        # =========================================
        # MAIN STORAGE
        # =========================================

        key = f"fp_ips:{fingerprint}"

        redis_client.sadd(key, ip)

        if redis_client.ttl(key) == -1:
            redis_client.expire(key, WINDOW_SECONDS)

        ip_count = redis_client.scard(key)

        # =========================================
        # RAPID ROTATION CHECK
        # =========================================

        time_key = f"fp_last_seen:{fingerprint}"

        last_seen = redis_client.get(time_key)

        now = int(time.time())

        redis_client.setex(time_key, WINDOW_SECONDS, now)

        rapid_rotation = False

        if last_seen:
            gap = now - int(last_seen)

            if gap < MIN_ROTATION_TIME:
                rapid_rotation = True

        # =========================================
        # HARD DETECTION
        # =========================================

        if ip_count >= MAX_IPS_PER_DEVICE:

            # strong proxy/vpn/datacenter
            if (
                getattr(visitor, "is_proxy", False)
                or getattr(visitor, "is_vpn", False)
                or getattr(visitor, "is_datacenter", False)
            ):
                return True

            # rapid switching
            if rapid_rotation:
                return True

        # =========================================
        # EXTREME ROTATION
        # =========================================

        if ip_count >= 8:
            return True

    except Exception:
        pass

    return False
