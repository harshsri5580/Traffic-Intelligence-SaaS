from app.services.redis_client import redis_client


def get_ip_reputation(ip: str):
    try:
        score = redis_client.get(f"ip_rep:{ip}")
        if score is not None:
            return int(score.decode() if isinstance(score, bytes) else score)
    except Exception:
        pass
    return 0


def update_ip_reputation(ip: str, score: int):
    try:
        redis_client.set(f"ip_rep:{ip}", score, ex=86400)
    except Exception:
        pass


# 🔥 YE FUNCTION YAHI ADD KARNA HAI
def increase_ip_risk(ip: str, amount: int = 10):
    try:
        current = get_ip_reputation(ip)
        new_score = max(min(current + amount, 100), 0)
        update_ip_reputation(ip, new_score)
    except Exception:
        pass


def update_ip_reputation(ip: str, score: int):
    try:
        redis_client.setex(f"ip_rep:{ip}", 86400, score)
    except Exception:
        pass
