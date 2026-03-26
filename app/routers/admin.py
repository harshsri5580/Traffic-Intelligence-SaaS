from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.blocked_ip import BlockedIP
from app.models.user import User
from app.models.campaign import Campaign
from sqlalchemy import func, cast, Integer
from app.models.conversion import Conversion
from app.models.click_log import ClickLog
from app.dependencies.auth import get_admin_user, get_current_user
from app.models.click_log import ClickLog
from app.models.campaign import Campaign
from app.models.user import User
from app.models.offer import Offer
from app.models.system_log import SystemLog
from app.models.system_settings import SystemSettings
from app.services.security import hash_password
from app.models.conversion import Conversion
from app.models.system_log import SystemLog
from datetime import datetime
from sqlalchemy import func
from datetime import datetime, timedelta

router = APIRouter(tags=["Admin"])


# ==============================
# ADMIN DASHBOARD STATS
# ==============================


@router.get("/stats")
def admin_stats(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):

    # USERS (exclude admin)
    total_users = db.query(User).filter(User.role != "admin").count()

    # CAMPAIGNS
    total_campaigns = db.query(Campaign).count()

    active_campaigns = (
        db.query(Campaign)
        .filter(Campaign.is_active == True, Campaign.is_deleted == False)
        .count()
    )

    # CLICKS
    total_clicks = db.query(ClickLog).count()

    # TODAY CLICKS
    today = datetime.utcnow().replace(hour=0, minute=0, second=0)

    today_clicks = db.query(ClickLog).filter(ClickLog.created_at >= today).count()

    # REVENUE
    revenue = db.query(func.sum(Conversion.payout)).scalar() or 0

    # ERRORS
    errors = db.query(SystemLog).filter(SystemLog.type == "ERROR").count()

    return {
        "total_users": total_users,
        "total_campaigns": total_campaigns,
        "total_clicks": total_clicks,
        "active_campaigns": active_campaigns,
        "today_clicks": today_clicks,
        "revenue": float(revenue),
        "errors": errors,
    }


# ==============================
# UPDATE USER PLAN
# ==============================


@router.put("/user/{user_id}/plan")
def update_user_plan(
    user_id: int,
    plan: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    valid_plans = ["basic", "pro", "elite"]

    if plan not in valid_plans:
        raise HTTPException(status_code=400, detail="Invalid plan")

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.plan = plan
    db.commit()
    db.refresh(user)

    return {
        "message": "Plan updated successfully",
        "user_id": user.id,
        "new_plan": user.plan,
    }


# ==============================
# BLOCK IP
# ==============================


@router.post("/block")
def block_ip(
    ip: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    existing = db.query(BlockedIP).filter(BlockedIP.ip_address == ip).first()

    if existing:
        raise HTTPException(status_code=400, detail="IP already blocked")

    blocked = BlockedIP(ip_address=ip)

    db.add(blocked)
    db.commit()

    return {"message": f"{ip} blocked"}


# ==============================
# UNBLOCK IP
# ==============================


@router.delete("/unblock/{ip}")
def unblock_ip(
    ip: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    blocked = db.query(BlockedIP).filter(BlockedIP.ip_address == ip).first()

    if not blocked:
        raise HTTPException(status_code=404, detail="IP not found")

    db.delete(blocked)
    db.commit()

    return {"message": f"{ip} unblocked successfully"}


# ==============================
# LIST BLOCKED IPS
# ==============================


@router.get("/blocked")
def list_blocked_ips(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):

    blocked_ips = db.query(BlockedIP).all()

    return {
        "total_blocked": len(blocked_ips),
        "ips": [ip.ip_address for ip in blocked_ips],
    }


# ==============================
# USERS OVERVIEW (ADMIN)
# ==============================


@router.get("/users-overview")
def users_overview(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):

    users = db.query(User).filter(User.role != "admin").all()

    result = []

    for u in users:

        # campaigns count
        total_campaigns = db.query(Campaign).filter(Campaign.user_id == u.id).count()

        active_campaigns = (
            db.query(Campaign)
            .filter(
                Campaign.user_id == u.id,
                getattr(Campaign, "is_deleted", False) == False,
            )
            .count()
        )

        # clicks count
        total_clicks = db.query(ClickLog).filter(ClickLog.user_id == u.id).count()

        # revenue (SAFE JOIN + CAST)
        revenue = (
            db.query(func.coalesce(func.sum(Conversion.payout), 0))
            .join(ClickLog, cast(Conversion.click_id, Integer) == ClickLog.id)
            .filter(
                ClickLog.user_id == u.id,
                Conversion.click_id.op("~")("^[0-9]+$"),  # 🔥 IMPORTANT
            )
            .scalar()
        )

        result.append(
            {
                "id": u.id,
                "email": u.email,
                "plan": getattr(u, "plan", "basic"),
                "status": False if u.role == "blocked" else True,
                "campaigns": total_campaigns or 0,
                "active_campaigns": active_campaigns or 0,  # ✅ ADD THIS
                "clicks": total_clicks or 0,
                "revenue": float(revenue or 0),
            }
        )

    return result


@router.post("/user/{user_id}/block")
def block_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = "blocked"
    db.commit()

    return {"message": "User blocked"}


@router.post("/user/{user_id}/unblock")
def unblock_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    user.role = "member"
    db.commit()

    return {"message": "User unblocked"}


@router.delete("/user/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    user = db.query(User).filter(User.id == user_id).first()

    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    # ❌ prevent admin delete
    if user.role == "admin":
        raise HTTPException(status_code=400, detail="Admin cannot be deleted")

    # ❌ only blocked users delete
    if user.role != "blocked":
        raise HTTPException(status_code=400, detail="Block user first")

    db.delete(user)
    db.commit()

    return {"message": "User deleted"}


# ==============================
# ADMIN CAMPAIGNS LIST
# ==============================


@router.get("/campaigns")
def get_campaigns(user_email: str = None, db: Session = Depends(get_db)):

    query = db.query(Campaign).join(User, Campaign.user_id == User.id)

    # ❌ deleted remove
    query = query.filter(Campaign.is_deleted == False)

    # ✅ user filter
    if user_email:
        query = query.filter(User.email == user_email)

    campaigns = query.all()

    result = []

    from sqlalchemy import func

    for c in campaigns:

        clicks = (
            db.query(func.count(ClickLog.id))
            .filter(ClickLog.campaign_id == c.id)
            .scalar()
        )

        revenue = (
            db.query(func.sum(Conversion.payout))
            .filter(Conversion.campaign_id == c.id)
            .scalar()
        )

        revenue = revenue or 0
        cost = 0

        profit = revenue - cost
        roi = (profit / (cost or 1)) * 100

        result.append(
            {
                "id": c.id,
                "name": c.name,
                "user_email": c.user.email,
                "clicks": clicks or 0,
                "revenue": revenue,
                "cost": cost,
                "profit": profit,
                "roi": roi,
                "is_active": c.is_active,
            }
        )

    return result


@router.get("/users-emails")
def get_users_emails(db: Session = Depends(get_db)):

    users = db.query(User).filter(User.role == "member").all()

    return [u.email for u in users]


@router.get("/traffic")
def get_traffic(db: Session = Depends(get_db)):

    logs = (
        db.query(ClickLog)
        .join(Campaign, ClickLog.campaign_id == Campaign.id)
        .join(User, Campaign.user_id == User.id)
        .order_by(ClickLog.created_at.desc())
        .limit(100)
        .all()
    )

    result = []

    for log in logs:

        campaign = db.query(Campaign).filter(Campaign.id == log.campaign_id).first()
        offer = db.query(Offer).filter(Offer.id == log.offer_id).first()  # ✅ ADD THIS

        result.append(
            {
                "ip_address": log.ip_address,
                "country": log.country,
                "device_type": log.device_type,
                "campaign_id": log.campaign_id,
                "campaign_name": campaign.name if campaign else None,
                "offer_id": log.offer_id,
                "offer_name": offer.name if offer else None,  # ✅ now works
                "bot_score": log.bot_score or 0,
                "status": log.status or "unknown",
                "created_at": log.created_at,
            }
        )

    return result


# ==============================
# SYSTEM LOGS (ADMIN)
# ==============================


@router.get("/logs")
def get_system_logs(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    logs = db.query(SystemLog).order_by(SystemLog.created_at.desc()).limit(200).all()

    result = []

    for log in logs:
        result.append(
            {
                "type": log.type,
                "message": log.message,
                "created_at": log.created_at,
            }
        )

    return result

    # ==============================


# TEST LOG (TEMP)
# ==============================


@router.get("/test-log")
def test_log(db: Session = Depends(get_db)):
    print("API HIT 🔥")

    log = SystemLog(type="INFO", message="Test log working")
    db.add(log)
    db.commit()

    return {"msg": "log added"}


@router.get("/system-settings")
def get_settings(db: Session = Depends(get_db)):

    settings = db.query(SystemSettings).first()

    if not settings:
        settings = SystemSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)

    return settings


@router.post("/system-settings")
def update_settings(data: dict, db: Session = Depends(get_db)):

    settings = db.query(SystemSettings).first()

    if not settings:
        settings = SystemSettings()
        db.add(settings)

    settings.max_campaigns = data.get("max_campaigns", settings.max_campaigns)
    settings.max_offers = data.get("max_offers", settings.max_offers)
    settings.max_rules = data.get("max_rules", settings.max_rules)

    db.commit()

    return {"message": "Settings updated"}


@router.put("/admin/update")
def update_admin(
    email: str,
    password: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not allowed")

    admin = db.query(User).filter(User.id == current_user.id).first()

    admin.email = email
    admin.hashed_password = hash_password(password)

    db.commit()

    return {"message": "Admin updated"}


@router.get("/stats/chart")
def admin_chart_stats(db: Session = Depends(get_db)):

    last_7_days = []
    clicks_data = []

    for i in range(7):
        day = datetime.utcnow() - timedelta(days=i)

        start = day.replace(hour=0, minute=0, second=0)
        end = day.replace(hour=23, minute=59, second=59)

        count = (
            db.query(func.count(ClickLog.id))
            .filter(ClickLog.created_at >= start, ClickLog.created_at <= end)
            .scalar()
        )

        last_7_days.append(day.strftime("%d %b"))
        clicks_data.append(count or 0)

    return {"labels": last_7_days[::-1], "clicks": clicks_data[::-1]}
