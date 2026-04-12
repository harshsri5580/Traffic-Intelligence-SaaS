# app/routers/conversion.py

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.models.user import User

from app.database import get_db
from app.models.conversion import Conversion
from app.models.blocked_zone import BlockedZone

router = APIRouter()


@router.get("/api/postback")
def track_conversion(
    click_id: str,
    api_key: str,
    offer_id: int | None = None,
    campaign_id: int | None = None,
    payout: float = 0,
    db: Session = Depends(get_db),
):
    try:
        # ✅ 1. check click exists
        # ✅ API KEY CHECK
        user = db.query(User).filter(User.api_key == api_key).first()
        if not user:
            return {"status": "invalid_api_key"}
        from app.models.click_log import ClickLog

        click = db.query(ClickLog).filter(ClickLog.click_id == click_id).first()
        print("CLICK FOUND:", click_id)
        print("SUB1 (ZONE):", click.sub1)
        print("COST:", click.cost)
        if not click:
            return {"status": "invalid_click"}

        # ✅ 2. prevent duplicate conversion
        exists = db.query(Conversion).filter(Conversion.click_id == click_id).first()
        if exists:
            return {"status": "duplicate"}

        # ✅ 3. save conversion
        conversion = Conversion(
            click_id=click_id,
            offer_id=click.offer_id,
            campaign_id=click.campaign_id,
            payout=payout,
        )

        # 🔥 update click
        click.payout = float(payout)
        click.status = "converted"

        db.add(conversion)
        db.commit()
        # =====================================================
        # 🔥 AUTO OPTIMIZATION ENGINE (SAFE)
        # =====================================================

        try:
            from app.models.campaign import Campaign
            from app.models.click_log import ClickLog
            from sqlalchemy import func

            # reload campaign safely
            campaign = (
                db.query(Campaign).filter(Campaign.id == click.campaign_id).first()
            )

            if campaign and campaign.auto_optimize:

                # ---------------------------
                # TOTAL REVENUE
                # ---------------------------
                total_revenue = (
                    db.query(func.sum(Conversion.payout))
                    .filter(Conversion.campaign_id == campaign.id)
                    .scalar()
                    or 0
                )

                # ---------------------------
                # TOTAL COST
                # ---------------------------
                total_cost = (
                    db.query(func.sum(ClickLog.cost))
                    .filter(ClickLog.campaign_id == campaign.id)
                    .scalar()
                    or 0
                )

                # ---------------------------
                # ROI
                # ---------------------------
                if total_cost == 0:
                    roi = -100
                else:
                    roi = ((total_revenue - total_cost) / total_cost) * 100
                    print("TOTAL REVENUE:", total_revenue)
                    print("TOTAL COST:", total_cost)
                    print("ROI:", roi)
                    print("THRESHOLD:", campaign.roi_threshold)

                # ---------------------------
                # AUTO DECISION
                # ---------------------------
                if roi < campaign.roi_threshold:
                    print("🔥 ENTERED BLOCK CONDITION 🔥")
                    # 🔥 AUTO ZONE BLOCK
                    zone = click.sub1 or "unknown"
                    print("ZONE TO BLOCK:", zone)

                    if zone:
                        exists = (
                            db.query(BlockedZone)
                            .filter(
                                BlockedZone.campaign_id == campaign.id,
                                BlockedZone.zone_id == zone,
                            )
                            .first()
                        )

                        if not exists:
                            db.add(BlockedZone(campaign_id=campaign.id, zone_id=zone))
                            print("✅ INSERTING BLOCKED ZONE:", zone)

                    campaign.auto_status = "blocked"

                elif roi > campaign.roi_threshold + 50:
                    campaign.auto_status = "scaled"

                else:
                    campaign.auto_status = "active"

                # 🔥🔥🔥 MOST IMPORTANT
                db.add(campaign)
                db.commit()
                db.refresh(campaign)

        except Exception:
            db.rollback()

        return {"status": "ok"}

    except Exception:
        db.rollback()
        return {"status": "error"}
