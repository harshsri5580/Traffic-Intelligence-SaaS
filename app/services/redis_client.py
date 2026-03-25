import os
import redis


# ======================================
# REDIS CONFIG
# ======================================

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB = int(os.getenv("REDIS_DB", 0))
REDIS_PASSWORD = os.getenv("REDIS_PASSWORD")


# ======================================
# CONNECTION POOL
# ======================================

pool = redis.ConnectionPool(
    host=REDIS_HOST,
    port=REDIS_PORT,
    db=REDIS_DB,
    password=REDIS_PASSWORD,
    decode_responses=True,
    max_connections=50,
)


# ======================================
# REDIS CLIENT
# ======================================

redis_client = redis.Redis(connection_pool=pool)


# ======================================
# SAFE REDIS PING
# ======================================


def redis_health_check():

    try:
        redis_client.ping()
        return True
    except Exception:
        return False
