from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from slugify import slugify
import uuid

from app.database import get_db
from app.models.campaign import Campaign
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.system_log import SystemLog
from pydantic import BaseModel, HttpUrl
from typing import List, Optional
from app.models.offer import Offer
from app.models.rule import Rule
from sqlalchemy import func
from app.models.click_log import ClickLog
from sqlalchemy import func
from app.services.plan_limits import get_final_campaign_limit
from app.models.subscription import Subscription
from datetime import datetime


router = APIRouter(tags=["Campaigns"])


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

    # 🔥 expiry check
    if sub.expire_date and sub.expire_date < datetime.utcnow():
        sub.status = "expired"

        # 🔥 ADD THIS (IMPORTANT)
        campaigns = (
            db.query(Campaign)
            .filter(Campaign.user_id == user_id, Campaign.is_active == True)
            .all()
        )

        for c in campaigns:
            c.is_active = False

        db.commit()

        raise HTTPException(status_code=403, detail="Subscription expired")


# ==========================
# ROI HELPER
# ==========================
def calculate_roi(revenue, cost):
    if cost == 0:
        return -100  # force block if no cost
    return ((revenue - cost) / cost) * 100


# ==========================
# SCHEMA
# ==========================


class CampaignCreate(BaseModel):
    name: str
    slug: Optional[str] = None

    fallback_url: Optional[HttpUrl] = None
    safe_page_url: Optional[HttpUrl] = None
    bot_url: Optional[HttpUrl] = None
    traffic_source: Optional[str] = "direct"
    # 🔥 ADD THIS
    sub1: Optional[str] = None
    sub2: Optional[str] = None
    # 🔥 ADD THIS (CRITICAL)
    auto_optimize: Optional[bool] = False
    roi_threshold: Optional[int] = 0


# ==========================
# CREATE CAMPAIGN
# ==========================


@router.post("/")
def create_campaign(
    data: CampaignCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_active_subscription(db, current_user.id)

    try:

        # ✅ NEW (DB BASED LIMIT)

        slug = data.slug

        if not slug:
            slug = slugify(data.name) + "-" + str(uuid.uuid4())[:6]

        existing = (
            db.query(Campaign)
            .filter(
                Campaign.slug == slug,
                Campaign.user_id == current_user.id,
            )
            .first()
        )

        if existing:
            raise HTTPException(status_code=400, detail="Slug already exists")

        active_count = (
            db.query(Campaign)
            .filter(
                Campaign.user_id == current_user.id,
                Campaign.is_active == True,
                Campaign.is_deleted == False,
            )
            .count()
        )

        # 🔥 decide active or inactive
        is_active = True

        limit = get_final_campaign_limit(db, current_user.id)

        if limit is not None and active_count >= limit:
            is_active = False

        campaign = Campaign(
            name=data.name,
            slug=slug,
            fallback_url=str(data.fallback_url) if data.fallback_url else None,
            safe_page_url=str(data.safe_page_url) if data.safe_page_url else None,
            bot_url=str(data.bot_url) if data.bot_url else None,
            traffic_source=data.traffic_source,
            auto_optimize=data.auto_optimize,
            roi_threshold=data.roi_threshold,
            sub1=data.sub1,
            sub2=data.sub2,
            user_id=current_user.id,
            is_active=is_active,
            is_deleted=False,
        )

        db.add(campaign)
        db.commit()
        db.refresh(campaign)

        # ✅ LOG ADD
        log = SystemLog(
            type="INFO",
            message=f"Campaign '{campaign.name}' created by {current_user.email}",
        )
        db.add(log)
        db.commit()

        return {"success": True, "campaign": campaign}

    except HTTPException as e:
        raise e  # ✅ IMPORTANT (limit error pass hoga)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ==========================
# LIST CAMPAIGNS
# ==========================


@router.get("/")
def list_campaigns(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    campaigns = (
        db.query(
            Campaign,
            # ✅ ONLY REAL PASS
            func.count(ClickLog.id)
            .filter(ClickLog.status == "offer")
            .label("pass_count"),
            # ✅ EVERYTHING ELSE = BLOCK
            func.count(ClickLog.id)
            .filter(ClickLog.status != "offer")
            .label("block_count"),
        )
        .outerjoin(ClickLog, ClickLog.campaign_id == Campaign.id)
        .filter(Campaign.user_id == current_user.id, Campaign.is_deleted == False)
        .group_by(Campaign.id)
        .all()
    )

    result = []

    for c, pass_count, block_count in campaigns:

        # ---------------- REVENUE ----------------
        revenue = (
            db.query(func.sum(ClickLog.payout))
            .filter(
                ClickLog.campaign_id == c.id,
                ClickLog.status == "converted",
            )
            .scalar()
        ) or 0

        # ---------------- COST ----------------
        cost = (
            db.query(func.sum(ClickLog.cost))
            .filter(ClickLog.campaign_id == c.id)
            .scalar()
        ) or 0

        # ---------------- ROI ----------------
        roi = calculate_roi(revenue, cost)

        # ---------------- AUTO OPTIMIZE ----------------
        auto_status = c.auto_status or "active"

        # ---------------- COUNTS ----------------
        offer_count = (
            db.query(Offer)
            .filter(Offer.campaign_id == c.id, Offer.is_deleted == False)
            .count()
        )

        rule_count = db.query(Rule).filter(Rule.campaign_id == c.id).count()

        result.append(
            {
                "id": c.id,
                "name": c.name,
                "slug": c.slug,
                "traffic_source": c.traffic_source,
                "sub1": c.sub1,
                "sub2": c.sub2,
                "is_active": c.is_active,
                "offer_count": offer_count,
                "rule_count": rule_count,
                "pass_count": pass_count or 0,
                "block_count": block_count or 0,
                # 🔥 FIXED
                "roi": round(roi, 2),
                "revenue": revenue,
                "cost": cost,
                "auto_status": c.auto_status or "active",
            }
        )
    return result


# ==========================
# TOGGLE CAMPAIGN
# ==========================


@router.put("/{campaign_id}/toggle")
def toggle_campaign_status(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_active_subscription(db, current_user.id)
    campaign = (
        db.query(Campaign)
        .filter(
            Campaign.id == campaign_id,
            Campaign.user_id == current_user.id,
            Campaign.is_deleted == False,
        )
        .first()
    )

    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # 🔥 ONLY CHECK WHEN ACTIVATING
    if not campaign.is_active:

        active_count = (
            db.query(Campaign)
            .filter(
                Campaign.user_id == current_user.id,
                Campaign.is_active == True,
                Campaign.is_deleted == False,
            )
            .count()
        )

        limit = get_final_campaign_limit(db, current_user.id)

        if limit is not None and active_count >= limit:
            raise HTTPException(
                status_code=403,
                detail="Active campaign limit reached",
            )

    # ✅ TOGGLE
    campaign.is_active = not campaign.is_active

    db.commit()
    db.refresh(campaign)

    status = "activated" if campaign.is_active else "paused"

    log = SystemLog(
        type="INFO",
        message=f"Campaign '{campaign.name}' {status} by {current_user.email}",
    )
    db.add(log)
    db.commit()

    return {"id": campaign.id, "is_active": campaign.is_active}


# ==========================
# DELETE CAMPAIGN
# ==========================


@router.delete("/{campaign_id}")
def delete_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_active_subscription(db, current_user.id)
    campaign = (
        db.query(Campaign)
        .filter(
            Campaign.id == campaign_id,
            Campaign.user_id == current_user.id,
            Campaign.is_deleted == False,
        )
        .first()
    )

    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # check offers
    offer_count = (
        db.query(Offer)
        .filter(Offer.campaign_id == campaign_id, Offer.is_deleted == False)
        .count()
    )

    # check rules
    rule_count = db.query(Rule).filter(Rule.campaign_id == campaign_id).count()

    if offer_count > 0 or rule_count > 0:
        raise HTTPException(
            status_code=400, detail="Delete rules and offers before deleting campaign"
        )

    campaign.is_deleted = True
    campaign.is_active = False

    db.commit()
    log = SystemLog(
        type="WARNING",
        message=f"Campaign '{campaign.name}' deleted by {current_user.email}",
    )
    db.add(log)
    db.commit()

    return {"success": True, "message": "Campaign deleted"}


@router.get("/{campaign_id}")
def get_campaign(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    campaign = (
        db.query(Campaign)
        .filter(
            Campaign.id == campaign_id,
            Campaign.user_id == current_user.id,
            Campaign.is_deleted == False,
        )
        .first()
    )

    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # ---------------- PASS TRAFFIC ----------------
    pass_count = (
        db.query(func.count(ClickLog.id))
        .filter(
            ClickLog.campaign_id == campaign_id,
            ClickLog.status.in_(["passed", "rule", "offer"]),
        )
        .scalar()
    )

    # ---------------- BLOCK TRAFFIC ----------------
    block_count = (
        db.query(func.count(ClickLog.id))
        .filter(
            ClickLog.campaign_id == campaign_id,
            ClickLog.status == "blocked",
        )
        .scalar()
    )

    return {
        "id": campaign.id,
        "name": campaign.name,
        "slug": campaign.slug,
        "traffic_source": campaign.traffic_source,
        "sub1": campaign.sub1,
        "sub2": campaign.sub2,
        "is_active": campaign.is_active,
        "fallback_url": campaign.fallback_url,
        "safe_page_url": campaign.safe_page_url,
        "bot_url": campaign.bot_url,
        "pass_count": pass_count or 0,
        "block_count": block_count or 0,
        "block_vpn": campaign.block_vpn,
        "block_proxy": campaign.block_proxy,
        "block_tor": campaign.block_tor,
        "block_datacenter": campaign.block_datacenter,
        "block_automation": campaign.block_automation,
        "block_canvas": campaign.block_canvas,
    }


@router.put("/{campaign_id}")
def update_campaign(
    campaign_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    check_active_subscription(db, current_user.id)
    campaign = (
        db.query(Campaign)
        .filter(
            Campaign.id == campaign_id,
            Campaign.user_id == current_user.id,
            Campaign.is_deleted == False,
        )
        .first()
    )

    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    # 🔥 CRITICAL FIX
    data.pop("user_id", None)

    # 🔥 FORCE USER
    campaign.user_id = current_user.id

    campaign.name = data.get("name", campaign.name)
    campaign.fallback_url = data.get("fallback_url", campaign.fallback_url)
    campaign.safe_page_url = data.get("safe_page_url", campaign.safe_page_url)
    campaign.bot_url = data.get("bot_url", campaign.bot_url)
    campaign.traffic_source = data.get("traffic_source", campaign.traffic_source)
    campaign.sub1 = data.get("sub1", campaign.sub1)
    campaign.sub2 = data.get("sub2", campaign.sub2)
    campaign.auto_optimize = data.get("auto_optimize", campaign.auto_optimize)
    campaign.roi_threshold = data.get("roi_threshold", campaign.roi_threshold)

    db.commit()

    return {"message": "Campaign updated"}


@router.put("/{campaign_id}/protection")
def update_protection(
    campaign_id: int,
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    campaign = (
        db.query(Campaign)
        .filter(
            Campaign.id == campaign_id,
            Campaign.user_id == current_user.id,
            Campaign.is_deleted == False,
        )
        .first()
    )

    if not campaign:
        raise HTTPException(404, "Campaign not found")

    campaign.block_vpn = data.get("block_vpn", False)
    campaign.block_proxy = data.get("block_proxy", False)
    campaign.block_tor = data.get("block_tor", False)
    campaign.block_datacenter = data.get("block_datacenter", False)
    campaign.block_automation = data.get("block_automation", False)
    campaign.block_canvas = data.get("block_canvas", False)

    db.commit()

    return {"status": "updated"}
