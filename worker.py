import json
import redis
import os

from app.models import *  # 🔥 required
from app.services.analytics import update_daily_stats

redis_client = redis.from_url(os.getenv("REDIS_URL"))

print("🚀 Worker started...")

while True:
    job = redis_client.brpop("click_queue")

    if not job:
        continue

    try:
        data = json.loads(job[1])

        update_daily_stats(
            data["campaign_id"],
            data["rule_id"],
            data["offer_id"],
            data["decision"],
            data["is_bot"],
        )

    except Exception as e:
        print("❌ WORKER ERROR:", e)
