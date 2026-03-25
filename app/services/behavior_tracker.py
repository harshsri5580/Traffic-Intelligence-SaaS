from services.redis_client import redis_client


def track_behavior(ip: str, data: dict):
    try:
        key = f"behavior:{ip}"

        if "mouse" in data:
            redis_client.hincrby(key, "mouse_moves", int(data.get("mouse", 0)))

        if "scroll" in data:
            redis_client.hincrby(key, "scrolls", int(data.get("scroll", 0)))

        if "click" in data:
            redis_client.hincrby(key, "clicks", int(data.get("click", 0)))

        if "time" in data:
            redis_client.hincrby(key, "time_spent", int(data.get("time", 0)))

        redis_client.expire(key, 600)  # 10 min TTL

    except Exception:
        pass
