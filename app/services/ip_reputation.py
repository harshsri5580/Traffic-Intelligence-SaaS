from app.services.redis_client import redis_client
import time

TTL = 86400  # 24 hours


# =========================================
# GET REPUTATION
# =========================================
def get_ip_reputation(ip: str) -> int:
    try:
        val = redis_client.get(f"ip_rep:{ip}")
        if val is None:
            return 0

        return int(val.decode() if isinstance(val, bytes) else val)

    except Exception:
        return 0


# =========================================
# SET REPUTATION (SAFE)
# =========================================
def set_ip_reputation(ip: str, score: int):
    try:
        score = max(0, min(int(score), 100))  # normalize
        redis_client.setex(f"ip_rep:{ip}", TTL, score)
    except Exception:
        pass


# =========================================
# INCREASE RISK (SMART)
# =========================================
def increase_ip_risk(ip: str, amount: int = 10):
    try:
        current = get_ip_reputation(ip)

        # 🔥 adaptive growth
        if current >= 80:
            amount = int(amount * 1.5)
        elif current <= 20:
            amount = int(amount * 0.7)

        new_score = current + amount

        set_ip_reputation(ip, new_score)

    except Exception:
        pass


# =========================================
# DECREASE RISK (LEARNING)
# =========================================
def decrease_ip_risk(ip: str, amount: int = 5):
    try:
        current = get_ip_reputation(ip)

        # slow decay (Adspect style)
        new_score = current - amount

        set_ip_reputation(ip, new_score)

    except Exception:
        pass


# =========================================
# DECAY SYSTEM (AUTO CLEANUP)
# =========================================
def decay_ip_reputation(ip: str):
    try:
        key = f"ip_rep_decay:{ip}"

        last = redis_client.get(key)
        now = int(time.time())

        if last:
            last = int(last)
            diff = now - last

            # every 1 hour decay
            if diff > 3600:
                decrease_ip_risk(ip, 5)
                redis_client.set(key, now)

        else:
            redis_client.set(key, now)

    except Exception:
        pass


# =========================================
# QUICK CHECK (HELPER)
# =========================================
def is_high_risk(ip: str) -> bool:
    try:
        return get_ip_reputation(ip) >= 70
    except Exception:
        return False
