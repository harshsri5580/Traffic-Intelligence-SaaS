from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models.click_log import ClickLog
from app.dependencies.auth import get_current_user
from app.models.user import User
from sqlalchemy import func
from app.models.click_log import ClickLog
from sqlalchemy import func, text
from app.models.conversion import Conversion
from app.models.subscription import Subscription
from datetime import datetime
from fastapi import HTTPException


router = APIRouter(prefix="/api/analytics", tags=["Analytics"])


def check_active_subscription(db, user_id):
    sub = (
        db.query(Subscription)
        .filter(
            Subscription.user_id == user_id,
            Subscription.status == "active",
        )
        .first()
    )

    if not sub:
        raise HTTPException(status_code=403, detail="Subscription expired")

    # 🔥 ADD THIS (CRITICAL)
    if sub.expire_date and sub.expire_date < datetime.utcnow():
        sub.status = "expired"
        db.commit()
        raise HTTPException(status_code=403, detail="Subscription expired")


# ================================
# RECENT CLICKS
# ================================


from app.models.campaign import Campaign
from app.models.offer import Offer


@router.get("/recent")
def get_recent_clicks(
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_active_subscription(db, current_user.id)
    offset = (page - 1) * limit

    query = (
        db.query(
            ClickLog,
            Campaign.name.label("campaign_name"),
            Offer.name.label("offer_name"),
            func.coalesce(func.sum(Conversion.payout), 0).label("revenue"),
        )
        .outerjoin(
            Conversion,
            ClickLog.click_id == Conversion.click_id,
        )
        .outerjoin(Campaign, Campaign.id == ClickLog.campaign_id)
        .outerjoin(Offer, Offer.id == ClickLog.offer_id)
        .filter(
            ClickLog.user_id == current_user.id,
            func.date(ClickLog.created_at) == func.current_date(),
        )
        .group_by(
            ClickLog.id,
            Campaign.name,
            Offer.name,
        )
        .order_by(ClickLog.created_at.desc())
    )
    total = query.count()

    rows = query.offset(offset).limit(limit).all()

    result = []

    for log, campaign_name, offer_name, revenue in rows:

        revenue = float(revenue or 0)

        # 🔥 COST from sub2
        try:
            cost = float(log.sub2) if log.sub2 else 0
        except:
            cost = 0

        # 🔥 EPC (per click)
        epc = revenue

        # 🔥 ROI
        roi = ((revenue - cost) / cost * 100) if cost > 0 else 0

        result.append(
            {
                "click_id": getattr(log, "click_id", None),
                "ip_address": log.ip_address,
                "country": log.country,
                "device_type": log.device_type,
                "browser": log.browser,
                "isp": log.isp,
                "campaign_name": campaign_name,
                "offer_name": offer_name,
                "bot_score": log.bot_score,
                "status": log.status,
                "created_at": log.created_at,
                "revenue": revenue,
                "cost": cost,
                "epc": round(epc, 2),
                "roi": round(roi, 2),
            }
        )

    total_pages = (total + limit - 1) // limit

    return {"logs": result, "total_pages": total_pages}


# ================================
# OVERVIEW STATS
# ================================


from sqlalchemy import func


@router.get("/overview")
def analytics_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_active_subscription(db, current_user.id)
    total = (
        db.query(func.count(ClickLog.id))
        .filter(ClickLog.user_id == current_user.id)
        .scalar()
    )

    passed = (
        db.query(func.count(ClickLog.id))
        .filter(ClickLog.user_id == current_user.id, ClickLog.status == "offer")
        .scalar()
    )

    blocked = (
        db.query(func.count(ClickLog.id))
        .filter(ClickLog.user_id == current_user.id, ClickLog.status == "blocked")
        .scalar()
    )

    bots = (
        db.query(func.count(ClickLog.id))
        .filter(ClickLog.user_id == current_user.id, ClickLog.bot_score >= 70)
        .scalar()
    )

    # 🔥 connection stats
    vpn = (
        db.query(func.count(ClickLog.id))
        .filter(ClickLog.user_id == current_user.id, ClickLog.connection_type == "vpn")
        .scalar()
    )

    datacenter = (
        db.query(func.count(ClickLog.id))
        .filter(
            ClickLog.user_id == current_user.id,
            ClickLog.connection_type.ilike("%data%"),
        )
        .scalar()
    )

    residential = (
        db.query(func.count(ClickLog.id))
        .filter(
            ClickLog.user_id == current_user.id,
            ClickLog.connection_type == "residential",
        )
        .scalar()
    )

    return {
        "total_clicks": total or 0,
        "real_traffic": passed or 0,
        "passed": passed or 0,
        "blocked": blocked or 0,
        "bots": bots or 0,
        "vpn": vpn or 0,
        "datacenter": datacenter or 0,
        "residential": residential or 0,
    }


# ================================
# COUNTRY STATS
# ================================


@router.get("/countries")
def analytics_countries(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    check_active_subscription(db, current_user.id)
    rows = (
        db.query(ClickLog.country, func.count(ClickLog.id))
        .filter(
            ClickLog.user_id == current_user.id,
            func.date(ClickLog.created_at) == func.current_date(),
        )
        .group_by(ClickLog.country)
        .order_by(func.count(ClickLog.id).desc())
        .limit(20)
        .all()
    )

    return [{"country": r[0], "clicks": r[1]} for r in rows]


# ================================
# DEVICE STATS
# ================================


@router.get("/devices")
def analytics_devices(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    check_active_subscription(db, current_user.id)
    rows = (
        db.query(ClickLog.device_type, func.count(ClickLog.id))
        .filter(
            ClickLog.user_id == current_user.id,
            func.date(ClickLog.created_at) == func.current_date(),
        )
        .group_by(ClickLog.device_type)
        .all()
    )

    return [{"device": r[0], "clicks": r[1]} for r in rows]


# ================================
# BROWSER STATS
# ================================


@router.get("/browsers")
def analytics_browsers(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    check_active_subscription(db, current_user.id)
    rows = (
        db.query(ClickLog.browser, func.count(ClickLog.id))
        .filter(
            ClickLog.user_id == current_user.id,
            func.date(ClickLog.created_at) == func.current_date(),
        )
        .group_by(ClickLog.browser)
        .all()
    )

    return [{"browser": r[0], "clicks": r[1]} for r in rows]


# ================================
# OFFER PERFORMANCE
# ================================


@router.get("/offers")
def analytics_offers(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    check_active_subscription(db, current_user.id)
    rows = (
        db.query(ClickLog.offer_id, func.count(ClickLog.id))
        .filter(
            ClickLog.user_id == current_user.id,
            func.date(ClickLog.created_at) == func.current_date(),
        )
        .group_by(ClickLog.offer_id)
        .order_by(func.count(ClickLog.id).desc())
        .all()
    )

    return [{"offer_id": r[0], "clicks": r[1]} for r in rows]


# ================================
# CAMPAIGN PERFORMANCE
# ================================


@router.get("/campaigns")
def analytics_campaigns(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    check_active_subscription(db, current_user.id)
    rows = (
        db.query(ClickLog.campaign_id, func.count(ClickLog.id))
        .filter(
            ClickLog.user_id == current_user.id,
            func.date(ClickLog.created_at) == func.current_date(),
        )
        .group_by(ClickLog.campaign_id)
        .order_by(func.count(ClickLog.id).desc())
        .all()
    )

    return [{"campaign_id": r[0], "clicks": r[1]} for r in rows]


# ================================
# TRAFFIC SOURCE STATS
# ================================


@router.get("/sources")
def traffic_sources(
    range: str = "today",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_active_subscription(db, current_user.id)
    query = db.query(ClickLog.traffic_source, func.count(ClickLog.id)).filter(
        ClickLog.user_id == current_user.id
    )

    if range == "today":
        query = query.filter(func.date(ClickLog.created_at) == func.current_date())

    elif range == "yesterday":
        query = query.filter(func.date(ClickLog.created_at) == func.current_date() - 1)

    elif range == "7d":
        query = query.filter(
            ClickLog.created_at >= func.now() - text("interval '7 days'")
        )

    rows = (
        query.group_by(ClickLog.traffic_source)
        .order_by(func.count(ClickLog.id).desc())
        .all()
    )

    return [{"source": r[0] or "direct", "clicks": r[1]} for r in rows]


@router.get("/offer-performance")
def offer_performance(db: Session = Depends(get_db)):

    rows = db.execute(
        text(
            """

SELECT
    offers.name as offer_name,
    click_logs.offer_id,
    COUNT(click_logs.id) as clicks,
    COUNT(conversions.id) as conversions,
    COALESCE(SUM(conversions.payout),0) as revenue

FROM click_logs

LEFT JOIN conversions
ON conversions.offer_id = click_logs.offer_id

LEFT JOIN offers
ON offers.id = click_logs.offer_id

GROUP BY click_logs.offer_id, offers.name

"""
        )
    ).fetchall()

    result = []

    for r in rows:

        clicks = r.clicks or 0
        revenue = r.revenue or 0

        epc = revenue / clicks if clicks > 0 else 0

        result.append(
            {
                "offer_id": r.offer_id,
                "clicks": clicks,
                "conversions": r.conversions,
                "revenue": revenue,
                "epc": round(epc, 2),
            }
        )

    return result


@router.get("/bot-stats")
def bot_stats(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):

    logs = db.query(ClickLog).filter(ClickLog.user_id == current_user.id).all()

    result = {"human": 0, "bot": 0, "suspicious": 0}

    for log in logs:

        # use risk score
        if log.risk_score >= 70:
            result["bot"] += 1
        elif log.risk_score >= 40:
            result["suspicious"] += 1
        else:
            result["human"] += 1

    return result


@router.get("/zones")
def zone_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = {}

    clicks = db.query(ClickLog).filter(ClickLog.user_id == current_user.id).all()

    for c in clicks:
        zone = c.sub1 or "unknown"

        # ✅ campaign fetch
        campaign = db.query(Campaign).filter(Campaign.id == c.campaign_id).first()

        if zone not in result:
            result[zone] = {
                "zone_id": zone,
                "cost": 0,
                "revenue": 0,
                "clicks": 0,
                "campaign_name": campaign.name if campaign else "Unknown",
            }

        # ✅ clicks count
        result[zone]["clicks"] += 1

        # ✅ cost
        try:
            cost = float(c.sub2) if c.sub2 else 0
        except:
            cost = 0

        result[zone]["cost"] += cost

    conversions = db.query(Conversion).all()

    for conv in conversions:

        click = (
            db.query(ClickLog)
            .filter(
                ClickLog.click_id == conv.click_id, ClickLog.user_id == current_user.id
            )
            .first()
        )

        if not click:
            continue

        zone = click.sub1 or "unknown"

        # ✅ campaign fetch
        campaign = db.query(Campaign).filter(Campaign.id == click.campaign_id).first()

        if zone not in result:
            result[zone] = {
                "zone_id": zone,
                "cost": 0,
                "revenue": 0,
                "clicks": 0,
                "campaign_name": campaign.name if campaign else "Unknown",
            }

        # ✅ revenue
        result[zone]["revenue"] += float(conv.payout or 0)

    return list(result.values())
