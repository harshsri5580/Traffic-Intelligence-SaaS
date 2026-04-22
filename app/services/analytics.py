from sqlalchemy import func, and_
from datetime import datetime, timedelta, date

from app.models.click_log import ClickLog
from app.models.campaign_daily_stats import CampaignDailyStats
from app.models.offer_daily_stats import OfferDailyStats
from app.models.rule_daily_stats import RuleDailyStats
from app.database import SessionLocal


# ======================================
# CAMPAIGN STATS
# ======================================


def get_campaign_stats(campaign_id: int):

    db = SessionLocal()

    # ---------------- TOTAL CLICKS ----------------

    total_clicks = (
        db.query(func.count(ClickLog.id))
        .filter(ClickLog.campaign_id == campaign_id)
        .scalar()
    )

    passed = (
        db.query(func.count(ClickLog.id))
        .filter(
            ClickLog.campaign_id == campaign_id,
            ClickLog.status.in_(["passed", "rule", "offer"]),
        )
        .scalar()
    )

    blocked = (
        db.query(func.count(ClickLog.id))
        .filter(ClickLog.campaign_id == campaign_id, ClickLog.status == "blocked")
        .scalar()
    )

    # ---------------- UNIQUE IPS ----------------

    unique_ips = (
        db.query(func.count(func.distinct(ClickLog.ip_address)))
        .filter(ClickLog.campaign_id == campaign_id)
        .scalar()
    )

    # ---------------- TODAY CLICKS ----------------

    today_start = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    today_clicks = (
        db.query(func.count(ClickLog.id))
        .filter(ClickLog.campaign_id == campaign_id, ClickLog.created_at >= today_start)
        .scalar()
    )

    # ---------------- OFFER STATS ----------------

    offer_stats = (
        db.query(ClickLog.offer_id, func.count(ClickLog.id))
        .filter(ClickLog.campaign_id == campaign_id)
        .group_by(ClickLog.offer_id)
        .all()
    )

    # ---------------- COUNTRY STATS ----------------

    country_stats = (
        db.query(ClickLog.country, func.count(ClickLog.id))
        .filter(ClickLog.campaign_id == campaign_id)
        .group_by(ClickLog.country)
        .all()
    )

    # ---------------- DEVICE STATS ----------------

    device_stats = (
        db.query(ClickLog.device_type, func.count(ClickLog.id))
        .filter(ClickLog.campaign_id == campaign_id)
        .group_by(ClickLog.device_type)
        .all()
    )

    # ---------------- BOT RATE ----------------

    bot_clicks = (
        db.query(func.count(ClickLog.id))
        .filter(ClickLog.campaign_id == campaign_id, ClickLog.is_bot == True)
        .scalar()
    )

    bot_rate = 0

    if total_clicks and total_clicks > 0:
        bot_rate = round((bot_clicks / total_clicks) * 100, 2)

    db.close()

    return {
        "total_clicks": total_clicks,
        "today_clicks": today_clicks,
        "unique_ips": unique_ips,
        "passed": passed,
        "blocked": blocked,
        "bot_rate": bot_rate,
        "country_stats": [{"country": c[0], "clicks": c[1]} for c in country_stats],
        "device_stats": [{"device_type": d[0], "clicks": d[1]} for d in device_stats],
    }


# ======================================
# TRAFFIC TIMESERIES (LAST 7 DAYS)
# ======================================


def get_traffic_timeseries(campaign_id: int):

    db = SessionLocal()

    start_date = datetime.utcnow() - timedelta(days=7)

    rows = (
        db.query(func.date(ClickLog.created_at), func.count(ClickLog.id))
        .filter(ClickLog.campaign_id == campaign_id, ClickLog.created_at >= start_date)
        .group_by(func.date(ClickLog.created_at))
        .order_by(func.date(ClickLog.created_at))
        .all()
    )

    db.close()

    return [{"date": str(r[0]), "clicks": r[1]} for r in rows]


def update_daily_stats(campaign_id, rule_id, offer_id, decision, is_bot):

    db = SessionLocal()
    today = date.today()

    try:
        # ---------------- CAMPAIGN ----------------
        campaign_stats = (
            db.query(CampaignDailyStats)
            .filter(
                CampaignDailyStats.campaign_id == campaign_id,
                CampaignDailyStats.date == today,
            )
            .first()
        )

        if not campaign_stats:
            campaign_stats = CampaignDailyStats(
                campaign_id=campaign_id,
                date=today,
                total_clicks=0,
                passed=0,
                blocked=0,
                fallback=0,
                bots=0,
            )
            db.add(campaign_stats)

        campaign_stats.total_clicks += 1

        if decision == "blocked":
            campaign_stats.blocked += 1
        elif decision == "passed":
            campaign_stats.passed += 1
        else:
            campaign_stats.fallback += 1

        if is_bot:
            campaign_stats.bots += 1

        # ---------------- OFFER ----------------
        if offer_id:
            offer_stats = (
                db.query(OfferDailyStats)
                .filter(
                    OfferDailyStats.offer_id == offer_id,
                    OfferDailyStats.date == today,
                )
                .first()
            )

            if not offer_stats:
                offer_stats = OfferDailyStats(
                    offer_id=offer_id, date=today, clicks=0, bots=0
                )
                db.add(offer_stats)

            offer_stats.clicks += 1

            if is_bot:
                offer_stats.bots += 1

        # ---------------- RULE ----------------
        if rule_id:
            rule_stats = (
                db.query(RuleDailyStats)
                .filter(
                    RuleDailyStats.rule_id == rule_id,
                    RuleDailyStats.date == today,
                )
                .first()
            )

            if not rule_stats:
                rule_stats = RuleDailyStats(
                    rule_id=rule_id,
                    date=today,
                    matches=0,
                    blocked=0,
                    passed=0,
                )
                db.add(rule_stats)

            rule_stats.matches += 1

            if decision == "blocked":
                rule_stats.blocked += 1
            elif decision == "passed":
                rule_stats.passed += 1

        db.commit()

    except Exception as e:
        db.rollback()
        print("❌ ANALYTICS ERROR:", e)

    finally:
        db.close()
