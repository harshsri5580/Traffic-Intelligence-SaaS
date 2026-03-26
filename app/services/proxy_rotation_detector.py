from app.services.redis_client import redis_client


MAX_IPS_PER_DEVICE = 3
WINDOW_SECONDS = 300


def detect_proxy_rotation(visitor):

    try:

        fingerprint = visitor.session_fingerprint
        ip = visitor.ip
        # print("PROXY DEBUG:", fingerprint, ip)

        if not fingerprint or not ip:
            return False

        key = f"fp_ips:{fingerprint}"

        redis_client.sadd(key, ip)

        if redis_client.ttl(key) == -1:
            redis_client.expire(key, WINDOW_SECONDS)

        ip_count = redis_client.scard(key)

        if ip_count > MAX_IPS_PER_DEVICE:
            return True

    except Exception:
        pass

    return False
