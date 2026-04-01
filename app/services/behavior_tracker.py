from app.services.redis_client import redis_client
import time


def track_behavior(ip: str, data: dict):
    try:
        if not ip or not isinstance(data, dict):
            return

        key = f"behavior:{ip}"
        now = int(time.time())

        # ---------------------------------
        # BASIC COUNTERS
        # ---------------------------------
        mouse = int(data.get("mouse", 0) or 0)
        scroll = int(data.get("scroll", 0) or 0)
        click = int(data.get("click", 0) or 0)
        time_spent = int(data.get("time", 0) or 0)

        if mouse:
            redis_client.hincrby(key, "mouse_moves", mouse)

        if scroll:
            redis_client.hincrby(key, "scrolls", scroll)

        if click:
            redis_client.hincrby(key, "clicks", click)

        if time_spent:
            redis_client.hincrby(key, "time_spent", time_spent)

        # ---------------------------------
        # SESSION TIMING (NEW 🔥)
        # ---------------------------------
        last_seen = redis_client.hget(key, "last_seen")

        if last_seen:
            delta = now - int(last_seen)

            # ultra fast interaction → bot signal
            if delta < 1:
                redis_client.hincrby(key, "fast_hits", 1)

            # long gap → reset-like behavior
            if delta > 300:
                redis_client.hincrby(key, "session_breaks", 1)

        redis_client.hset(key, "last_seen", now)

        # ---------------------------------
        # VELOCITY TRACKING (NEW 🔥)
        # ---------------------------------
        rate_key = f"behavior_rate:{ip}"

        hits = redis_client.incr(rate_key)

        if hits == 1:
            redis_client.expire(rate_key, 10)

        if hits > 50:
            redis_client.hincrby(key, "high_velocity", 1)

        # ---------------------------------
        # HUMAN CONSISTENCY SCORE
        # ---------------------------------
        if mouse > 10 and scroll > 5:
            redis_client.hincrby(key, "human_signals", 1)

        # ---------------------------------
        # BOT-LIKE PATTERN
        # ---------------------------------
        if mouse == 0 and scroll == 0 and click == 0:
            redis_client.hincrby(key, "no_interaction", 1)

        # ---------------------------------
        # TTL (EXTENDED)
        # ---------------------------------
        redis_client.expire(key, 900)  # 15 min

    except Exception:
        pass
