from app.services.redis_client import redis_client


def update_campaign_learning(campaign_id: int, decision: str):
    try:
        key = f"campaign_stats:{campaign_id}"

        redis_client.hincrby(key, "total", 1)

        if decision in ["blocked"]:
            redis_client.hincrby(key, "blocked", 1)

        if decision in ["offer", "pass"]:
            redis_client.hincrby(key, "passed", 1)

        redis_client.expire(key, 86400)

    except Exception:
        pass


def get_campaign_risk(campaign_id: int):
    try:
        key = f"campaign_stats:{campaign_id}"

        data = redis_client.hgetall(key)

        if not data:
            return 0

        total = int(data.get(b"total", 0))
        blocked = int(data.get(b"blocked", 0))

        if total == 0:
            return 0

        risk = (blocked / total) * 100

        return int(risk)

    except Exception:
        return 0


def update_source_learning(source: str, decision: str):
    try:
        key = f"source_stats:{source or 'direct'}"

        redis_client.hincrby(key, "total", 1)

        if decision == "blocked":
            redis_client.hincrby(key, "blocked", 1)

        redis_client.expire(key, 86400)

    except Exception:
        pass


def get_source_risk(source: str):
    try:
        key = f"source_stats:{source or 'direct'}"

        data = redis_client.hgetall(key)

        if not data:
            return 0

        total = int(data.get(b"total", 0))
        blocked = int(data.get(b"blocked", 0))

        if total == 0:
            return 0

        return int((blocked / total) * 100)

    except Exception:
        return 0


# ================================
# 🔥 AI MULTI SIGNAL LEARNING ENGINE
# ================================


def update_ai_learning(visitor, decision: str):
    try:
        keys = [
            f"asn:{visitor.asn}",
            f"isp:{visitor.isp}",
            f"country:{visitor.country_code}",
            f"fp:{visitor.full_fingerprint}",
        ]

        for key in keys:
            if not key:
                continue

            redis_key = f"ai_stats:{key}"

            redis_client.hincrby(redis_key, "total", 1)

            if decision == "blocked":
                redis_client.hincrby(redis_key, "bad", 1)
            else:
                redis_client.hincrby(redis_key, "good", 1)

            redis_client.expire(redis_key, 86400)

    except Exception:
        pass


def get_ai_risk(visitor):
    try:
        keys = [
            f"asn:{visitor.asn}",
            f"isp:{visitor.isp}",
            f"country:{visitor.country_code}",
            f"fp:{visitor.full_fingerprint}",
        ]

        total_risk = 0
        count = 0

        for key in keys:
            redis_key = f"ai_stats:{key}"

            data = redis_client.hgetall(redis_key)

            if not data:
                continue

            total = int(data.get(b"total", 0))
            bad = int(data.get(b"bad", 0))

            if total < 20:
                continue  # ignore low data

            risk = (bad / total) * 100

            total_risk += risk
            count += 1

        if count == 0:
            return 0

        return int(total_risk / count)

    except Exception:
        return 0
