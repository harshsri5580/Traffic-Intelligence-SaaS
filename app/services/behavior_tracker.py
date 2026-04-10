import time
import hashlib
from app.services.redis_client import redis_client


def generate_fp(ip: str, ua: str) -> str:
    return hashlib.md5(ua.encode()).hexdigest()


def track_behavior(ip: str, ua: str, data: dict):
    try:
        if not ip or not isinstance(data, dict):
            return

        # 🔥 FIX: fp पहले बनाओ
        fp = generate_fp(ip, ua)
        key = f"behavior:{fp}"

        print("🔥 TRACK FUNCTION HIT")
        print("FP:", fp)
        print("KEY:", key)

        mouse = int(data.get("mouse", 0) or 0)
        scroll = int(data.get("scroll", 0) or 0)
        click = int(data.get("click", 0) or 0)
        time_spent = int(data.get("time", 0) or 0)

        redis_client.hincrby(key, "mouse", mouse)
        redis_client.hincrby(key, "scroll", scroll)
        redis_client.hincrby(key, "click", click)
        redis_client.hincrby(key, "time", time_spent)

        score = 0

        if mouse > 0:
            score += 2
        if scroll > 0:
            score += 2
        if click > 0:
            score += 3
        if time_spent > 5:
            score += 2
        if mouse > 10 and scroll > 5:
            score += 3

        redis_client.hincrby(key, "score", score)

        redis_client.expire(key, 900)

        print("🔥 SAVED TO REDIS")

    except Exception as e:
        print("BEHAVIOR ERROR:", e)
