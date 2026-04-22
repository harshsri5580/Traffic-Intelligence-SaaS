import json
import os
import redis

redis_client = redis.from_url(os.getenv("REDIS_URL"))


def push_click(data):
    try:
        redis_client.lpush("click_queue", json.dumps(data))
    except Exception as e:
        print("❌ REDIS PUSH ERROR:", e)

        try:
            with open("failed_queue.log", "a") as f:
                f.write(json.dumps(data) + "\n")
        except:
            pass
