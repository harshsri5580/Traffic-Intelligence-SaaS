import json
import redis
import os
import time
from datetime import datetime
from app.models import *
from app.services.analytics import update_daily_stats

from clickhouse_connect import get_client

# =========================
# REDIS
# =========================
redis_client = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"))

# =========================
# CLICKHOUSE
# =========================
clickhouse = get_client(host=os.getenv("CLICKHOUSE_HOST", "localhost"), port=8123)

batch = []

print("🚀 Worker started...")

while True:
    job = redis_client.brpop("click_queue", timeout=1)

    if not job:
        continue

    try:
        data = json.loads(job[1])

        # =========================
        # 1. UPDATE STATS (FAST)
        # =========================
        update_daily_stats(
            data.get("campaign_id"),
            data.get("rule_id"),
            data.get("offer_id"),
            data.get("decision"),
            data.get("is_bot"),
        )

        # =========================
        # 2. ADD TO BATCH
        # =========================
        batch.append(
            {
                "user_id": data.get("user_id", 0),
                "campaign_id": data.get("campaign_id", 0),
                "country_code": data.get("country_code", "unknown"),
                "device": data.get("device", "unknown"),
                "revenue": float(data.get("revenue", 0) or 0),
                "cost": float(data.get("cost", 0) or 0),
                "is_bot": int(data.get("is_bot", 0)),
                "is_proxy": int(data.get("is_proxy", 0)),
                "created_at": data.get("created_at") or datetime.utcnow(),
            }
        )

        # =========================
        # 3. BATCH INSERT (IMPORTANT)
        # =========================
        if len(batch) >= 1000:
            try:
                clickhouse.insert("traffic.click_logs", batch)
                batch.clear()
            except Exception as e:
                print("❌ ClickHouse insert failed:", e)
            batch.clear()

    except Exception as e:
        print("❌ WORKER ERROR:", e)

    # =========================
    # 4. SAFETY FLUSH
    # =========================
    if len(batch) >= 1000:
        clickhouse.insert("traffic.click_logs", batch)
        batch.clear()

    # 🔥 idle flush (important)
    elif len(batch) > 0:
        time.sleep(0.01)

        # flush if queue empty
        if redis_client.llen("click_queue") == 0:
            clickhouse.insert("traffic.click_logs", batch)
            batch.clear()
