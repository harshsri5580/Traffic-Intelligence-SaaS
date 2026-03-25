from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
import secrets
from sqlalchemy import func
from models.click_log import ClickLog
from models.conversion import Conversion
from database import get_db
from models.user import User
from routers.auth import get_current_user
from services.security import verify_password, hash_password
from sqlalchemy import cast, Integer

router = APIRouter(prefix="/user", tags=["User"])


# ================= PROFILE =================


@router.get("/profile")
def get_profile(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):
    return {
        "name": current_user.name if hasattr(current_user, "name") else "",
        "email": current_user.email,
        "timezone": getattr(current_user, "timezone", "UTC"),
        "webhook_url": getattr(current_user, "webhook_url", ""),
        "api_key": getattr(current_user, "api_key", ""),
    }


@router.put("/profile")
def update_profile(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    current_user.name = data.get("name", current_user.name)
    current_user.email = data.get("email", current_user.email)
    current_user.timezone = data.get("timezone", current_user.timezone)
    current_user.webhook_url = data.get("webhook_url", current_user.webhook_url)

    db.commit()

    return {"message": "Profile updated"}


# ================= PASSWORD =================


@router.post("/change-password")
def change_password(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    if not verify_password(data.get("current_password"), current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Wrong current password")

    current_user.hashed_password = hash_password(data.get("new_password"))

    db.commit()

    return {"message": "Password changed"}


# ================= API KEY =================


@router.post("/api-key")
def generate_api_key(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):

    new_key = secrets.token_hex(16)

    current_user.api_key = new_key

    db.commit()

    return {"api_key": new_key}


# ================= USER STATS =================


@router.get("/stats")
def get_user_stats(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):

    user_id = current_user.id

    # clicks
    total_clicks = db.query(ClickLog).filter(ClickLog.user_id == user_id).count()

    # revenue (FIXED ✅)
    revenue = (
        db.query(func.coalesce(func.sum(Conversion.payout), 0))
        .join(ClickLog, cast(Conversion.click_id, Integer) == ClickLog.id)
        .filter(ClickLog.user_id == user_id)
        .scalar()
    )

    # cost
    cost = (
        db.query(func.coalesce(func.sum(ClickLog.cost), 0))
        .filter(ClickLog.user_id == user_id)
        .scalar()
    )

    return {
        "total_clicks": total_clicks or 0,
        "revenue": revenue or 0,
        "cost": cost or 0,
    }


# ================= USER CAMPAIGN STATS =================


@router.get("/campaign-stats")
def get_user_campaign_stats(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):

    user_id = current_user.id

    data = (
        db.query(
            ClickLog.campaign_id,
            func.count(ClickLog.id).label("clicks"),
            func.coalesce(func.sum(ClickLog.cost), 0).label("cost"),
            func.coalesce(func.sum(Conversion.payout), 0).label("revenue"),
        )
        .outerjoin(Conversion, cast(Conversion.click_id, Integer) == ClickLog.id)
        .filter(ClickLog.user_id == user_id)
        .group_by(ClickLog.campaign_id)
        .all()
    )

    result = []

    for row in data:
        result.append(
            {
                "name": f"Campaign {row.campaign_id}",  # simple name (safe)
                "clicks": row.clicks or 0,
                "cost": float(row.cost or 0),
                "revenue": float(row.revenue or 0),
            }
        )

    return result
