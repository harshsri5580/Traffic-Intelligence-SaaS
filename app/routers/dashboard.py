from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from datetime import date, timedelta

from app.database import get_db
from app.models.campaign import Campaign
from app.models.user import User
from app.models.campaign_daily_stats import CampaignDailyStats
from app.models.offer import Offer
from app.models.offer_daily_stats import OfferDailyStats
from app.models.click_log import ClickLog
from app.models.rule import Rule
from app.models.rule_daily_stats import RuleDailyStats
from app.dependencies.auth import get_current_user
from fastapi import WebSocket, WebSocketDisconnect
from app.services.realtime_service import connect, disconnect

router = APIRouter(tags=["Dashboard"])


# ==============================
# MAIN DASHBOARD STATS
# ==============================


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db), current_user: User = Depends(get_current_user)
):

    # =====================
    # CAMPAIGN STATS
    # =====================

    total_campaigns = (
        db.query(Campaign)
        .filter(Campaign.user_id == current_user.id, Campaign.is_deleted == False)
        .count()
    )

    active_campaigns = (
        db.query(Campaign)
        .filter(
            Campaign.user_id == current_user.id,
            Campaign.is_active == True,
            Campaign.is_deleted == False,
        )
        .count()
    )

    inactive_campaigns = max(total_campaigns - active_campaigns, 0)

    # =====================
    # TRAFFIC STATS
    # =====================

    stats = (
        db.query(
            func.count(ClickLog.id),
            func.sum(
                case(
                    (ClickLog.status.in_(["passed", "offer", "rule", "fallback"]), 1),
                    else_=0,
                )
            ),
            func.sum(case((ClickLog.status == "blocked", 1), else_=0)),
        )
        .join(Campaign, Campaign.id == ClickLog.campaign_id)
        .filter(Campaign.user_id == current_user.id)
        .first()
    )

    total_clicks = stats[0] or 0
    passed = stats[1] or 0
    blocked = stats[2] or 0

    # =====================
    # TODAY CLICKS
    # =====================

    today = date.today()

    today_clicks = (
        db.query(func.count(ClickLog.id))
        .join(Campaign, Campaign.id == ClickLog.campaign_id)
        .filter(
            Campaign.user_id == current_user.id,
            func.date(ClickLog.created_at) == today,
        )
        .scalar()
        or 0
    )

    # =====================
    # UNIQUE IPS
    # =====================

    unique_ips = (
        db.query(func.count(func.distinct(ClickLog.ip_address)))
        .join(Campaign, Campaign.id == ClickLog.campaign_id)
        .filter(Campaign.user_id == current_user.id)
        .scalar()
        or 0
    )

    # =====================
    # DEVICE STATS
    # =====================

    device_stats_query = (
        db.query(ClickLog.device_type, func.count(ClickLog.id))
        .join(Campaign, Campaign.id == ClickLog.campaign_id)
        .filter(Campaign.user_id == current_user.id)
        .group_by(ClickLog.device_type)
        .all()
    )

    device_stats = []

    for device, clicks in device_stats_query:
        device_stats.append({"device_type": device or "unknown", "clicks": clicks})

    # =====================
    # COUNTRY STATS
    # =====================

    country_stats_query = (
        db.query(ClickLog.country, func.count(ClickLog.id))
        .join(Campaign, Campaign.id == ClickLog.campaign_id)
        .filter(Campaign.user_id == current_user.id)
        .group_by(ClickLog.country)
        .order_by(func.count(ClickLog.id).desc())
        .limit(10)
        .all()
    )

    country_stats = []

    for country, clicks in country_stats_query:
        country_stats.append({"country": country or "Unknown", "clicks": clicks})

    # =====================
    # RESPONSE
    # =====================

    return {
        "total_clicks": total_clicks,
        "today_clicks": today_clicks,
        "unique_ips": unique_ips,
        "passed": passed,
        "blocked": blocked,
        "total_campaigns": total_campaigns,
        "active_campaigns": active_campaigns,
        "inactive_campaigns": inactive_campaigns,
        "device_stats": device_stats,
        "country_stats": country_stats,
    }


@router.websocket("/live")
async def live_dashboard(websocket: WebSocket):

    await websocket.accept()
    await connect(websocket)

    print("WebSocket client connected")

    try:
        while True:
            await websocket.receive()

    except WebSocketDisconnect:

        print("WebSocket client disconnected")

        disconnect(websocket)
