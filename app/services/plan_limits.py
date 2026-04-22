from sqlalchemy.orm import Session
from fastapi import HTTPException
from datetime import datetime

from app.models.subscription import Subscription
from app.models.plan import Plan
from app.models.campaign import Campaign
from app.models.offer import Offer
from app.models.rule import Rule
from app.models.click_log import ClickLog
from app.models.system_settings import SystemSettings


# ======================================
# GET USER PLAN
# ======================================


def get_user_plan(db: Session, user_id: int):

    sub = (
        db.query(Subscription)
        .filter(
            Subscription.user_id == user_id,
            Subscription.status == "active",
        )
        .first()
    )

    if not sub:
        raise HTTPException(status_code=403, detail="No active subscription")

    # expire check
    if sub.expire_date and sub.expire_date < datetime.utcnow():

        sub.status = "expired"
        db.commit()

        raise HTTPException(status_code=403, detail="Subscription expired")

    plan = db.query(Plan).filter(Plan.id == sub.plan_id).first()

    if not plan:
        raise HTTPException(status_code=403, detail="Invalid plan")

    return plan


# ======================================
# CAMPAIGN LIMIT
# ======================================


def check_campaign_limit(db: Session, user_id: int):

    plan = get_user_plan(db, user_id)

    count = (
        db.query(Campaign.id)
        .filter(
            Campaign.user_id == user_id,
            Campaign.is_deleted == False,
            Campaign.is_active == True,  # 🔥 ONLY ACTIVE CAMPAIGNS
        )
        .count()
    )

    if plan.max_campaigns and count >= plan.max_campaigns:

        raise HTTPException(
            status_code=403,
            detail="Campaign limit reached for your plan",
        )


# ======================================
# OFFER LIMIT
# ======================================


def check_offer_limit(db: Session, user_id: int):

    plan = get_user_plan(db, user_id)

    campaigns = db.query(Campaign.id).filter(
        Campaign.user_id == user_id, Campaign.is_deleted == False
    )

    count = db.query(Offer.id).filter(Offer.campaign_id.in_(campaigns)).count()

    limit = get_final_offer_limit(db, user_id)

    if limit is not None and count >= limit:
        raise HTTPException(
            status_code=403,
            detail="Active campaign limit reached for your plan",
        )


# ======================================
# RULE LIMIT
# ======================================


def check_rule_limit(db: Session, user_id: int):

    plan = get_user_plan(db, user_id)

    campaigns = db.query(Campaign.id).filter(
        Campaign.user_id == user_id, Campaign.is_deleted == False
    )

    count = db.query(Rule.id).filter(Rule.campaign_id.in_(campaigns)).count()

    limit = get_final_rule_limit(db, user_id)

    if limit is not None and count >= limit:
        raise HTTPException(
            status_code=403,
            detail="Active campaign limit reached for your plan",
        )


# ======================================
# MONTHLY CLICK LIMIT
# ======================================


def check_click_limit(db: Session, user_id: int):

    plan = get_user_plan(db, user_id)

    start_month = datetime.utcnow().replace(
        day=1, hour=0, minute=0, second=0, microsecond=0
    )

    count = (
        db.query(ClickLog.id)
        .filter(
            ClickLog.created_at >= start_month,
            ClickLog.user_id == user_id,
        )
        .count()
    )

    limit = get_final_monthly_click_limit(db, user_id)

    # print("🔥 DEBUG CLICKS:", count)
    # print("🔥 DEBUG LIMIT:", limit)

    if limit is not None and count >= limit:
        print("🚫 LIMIT HIT")
        raise HTTPException(status_code=403, detail="Limit reached")


# ======================================
# DAILY CLICK LIMIT (NEW)
# ======================================


def check_daily_click_limit(db: Session, user_id: int):

    plan = get_user_plan(db, user_id)

    start_day = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)

    count = (
        db.query(ClickLog.id)
        .filter(
            ClickLog.created_at >= start_day,
            ClickLog.user_id == user_id,
        )
        .count()
    )

    limit = get_final_daily_click_limit(db, user_id)

    if limit is not None and count >= limit:
        raise HTTPException(
            status_code=403,
            detail="Active campaign limit reached for your plan",
        )


def get_final_campaign_limit(db: Session, user_id: int):

    plan = get_user_plan(db, user_id)
    settings = db.query(SystemSettings).first()

    plan_limit = plan.max_campaigns
    system_limit = settings.max_campaigns if settings else None

    # ✅ FINAL LOGIC
    if system_limit is not None:
        if plan_limit is None:
            return system_limit
        return min(plan_limit, system_limit)

    return plan_limit


def get_final_offer_limit(db: Session, user_id: int):

    plan = get_user_plan(db, user_id)
    settings = db.query(SystemSettings).first()

    plan_limit = plan.max_offers
    system_limit = settings.max_offers if settings else None

    if system_limit is not None:
        if plan_limit is None:
            return system_limit
        return min(plan_limit, system_limit)

    return plan_limit


def get_final_rule_limit(db: Session, user_id: int):

    plan = get_user_plan(db, user_id)
    settings = db.query(SystemSettings).first()

    plan_limit = plan.max_rules
    system_limit = settings.max_rules if settings else None

    if system_limit is not None:
        if plan_limit is None:
            return system_limit
        return min(plan_limit, system_limit)

    return plan_limit


def get_final_daily_click_limit(db: Session, user_id: int):

    plan = get_user_plan(db, user_id)
    settings = db.query(SystemSettings).first()

    plan_limit = getattr(plan, "max_daily_clicks", None)
    system_limit = getattr(settings, "max_daily_clicks", None) if settings else None

    if system_limit is not None:
        if plan_limit is None:
            return system_limit
        return min(plan_limit, system_limit)

    return plan_limit


def get_final_monthly_click_limit(db: Session, user_id: int):

    plan = get_user_plan(db, user_id)

    # 🔥 FINAL FIX: only plan limit use करो
    return plan.max_monthly_clicks
