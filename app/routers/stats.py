from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from app.database import get_db
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.campaign import Campaign
from app.models.click_log import ClickLog
from app.models.offer import Offer
from app.models.rule import Rule
from app.services.analytics import get_campaign_stats

router = APIRouter(tags=["Stats"])


# ====================================
# Campaign Stats
# ====================================


@router.get("/campaign/{campaign_id}")
def campaign_stats(
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

    return get_campaign_stats(campaign_id)


# ====================================
# Traffic Logs (Analytics Page)
# ====================================


@router.get("/logs")
def traffic_logs(
    campaign_id: int | None = None,
    country: str | None = None,
    device: str | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    query = (
        db.query(ClickLog, Campaign, Offer, Rule)
        .join(Campaign, Campaign.id == ClickLog.campaign_id)
        .outerjoin(Offer, Offer.id == ClickLog.offer_id)
        .outerjoin(Rule, Rule.id == ClickLog.rule_id)
        .filter(Campaign.user_id == current_user.id)
    )
    # ✅ ADD THIS
    if campaign_id:
        query = query.filter(ClickLog.campaign_id == campaign_id)

    if country:
        query = query.filter(ClickLog.country.ilike(f"%{country}%"))

    if device:
        query = query.filter(ClickLog.device_type == device)

    if status:
        query = query.filter(ClickLog.status == status)

    logs = query.order_by(desc(ClickLog.created_at)).limit(200).all()

    data = []

    for log, campaign, offer, rule in logs:

        data.append(
            {
                "ip_address": log.ip_address,
                "country": log.country,
                "region": log.region,
                "city": log.city,
                "device_type": log.device_type,
                "browser": log.browser,
                "os": log.os,
                "campaign_id": campaign.id if campaign else None,
                "campaign": campaign.name if campaign else None,
                "offer": offer.url if offer else None,
                "destination": log.destination,
                "rule": rule.name if rule else None,
                "bot_score": log.bot_score,
                "risk_score": log.risk_score,
                "fingerprint": log.fingerprint,
                "status": log.status,
                "reason": log.reason,
                "referrer": log.referrer,
                "asn": log.asn,
                "isp": log.isp,
                "created_at": log.created_at,
            }
        )

    return data
