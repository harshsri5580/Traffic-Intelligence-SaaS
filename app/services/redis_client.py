import os
import redis

# ======================================
# REDIS CONFIG (RENDER READY)
# ======================================

redis_url = os.getenv("REDIS_URL")

if redis_url:
    try:
        redis_client = redis.from_url(
            redis_url,
            decode_responses=True,
            max_connections=50,
        )
        print("✅ Redis connected")
    except Exception as e:
        print("❌ Redis connection failed:", e)
        redis_client = None
else:
    print("⚠️ REDIS_URL not found")
    redis_client = None


# ======================================
# SAFE REDIS PING
# ======================================


def redis_health_check():
    try:
        if redis_client:
            redis_client.ping()
            return True
        return False
    except Exception:
        return False
