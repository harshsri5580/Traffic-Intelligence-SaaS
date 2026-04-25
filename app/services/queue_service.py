import json
import os
import redis


# ======================================
# REDIS AUTO CONFIG (LOCAL + SERVER SAFE)
# ======================================

REDIS_URL = os.getenv("REDIS_URL")

if REDIS_URL:
    # ✅ server / cloud
    redis_client = redis.from_url(REDIS_URL, decode_responses=True)
    # print("🔥 USING REDIS_URL")
else:
    # ✅ local fallback
    redis_client = redis.Redis(host="localhost", port=6379, decode_responses=True)
    # print("🔥 USING LOCAL REDIS")


# ======================================
# PUSH CLICK QUEUE
# ======================================


def push_click(data):
    try:
        redis_client.lpush("click_queue", json.dumps(data))
    except Exception as e:
        print("❌ REDIS PUSH ERROR:", e)

        # 🔥 fallback (file backup)
        try:
            with open("failed_queue.log", "a") as f:
                f.write(json.dumps(data) + "\n")
        except:
            pass
