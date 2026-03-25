from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models.offer import Offer
from app.models.campaign import Campaign
from app.dependencies.auth import get_current_user
from app.models.user import User
from app.models.rule_offer import RuleOffer


router = APIRouter(tags=["Offers"])


# ===============================
# SCHEMAS
# ===============================


class OfferCreate(BaseModel):
    campaign_id: int
    name: str
    url: str
    weight: int = 1
    redirect_mode: str = "direct"


class OfferUpdate(BaseModel):
    campaign_id: int
    name: str
    url: str
    weight: int
    redirect_mode: str


# ===============================
# CREATE OFFER
# ===============================


@router.post("/")
def create_offer(
    offer: OfferCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    campaign = (
        db.query(Campaign)
        .filter(
            Campaign.id == offer.campaign_id,
            Campaign.user_id == current_user.id,
            Campaign.is_deleted == False,
        )
        .first()
    )

    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    new_offer = Offer(
        campaign_id=offer.campaign_id,
        name=offer.name,
        url=offer.url,
        weight=offer.weight,
        redirect_mode=offer.redirect_mode,
        is_active=True,
        is_deleted=False,
    )

    db.add(new_offer)
    db.commit()
    db.refresh(new_offer)

    return new_offer


# ===============================
# LIST ALL OFFERS
# ===============================


@router.get("/")
def list_offers(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    offers = (
        db.query(Offer)
        .join(Campaign, Offer.campaign_id == Campaign.id)
        .filter(Campaign.user_id == current_user.id, Offer.is_deleted == False)
        .all()
    )

    return offers


# ===============================
# LIST OFFERS BY CAMPAIGN
# ===============================


@router.get("/campaign/{campaign_id}")
def list_campaign_offers(
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

    offers = (
        db.query(Offer)
        .filter(Offer.campaign_id == campaign_id, Offer.is_deleted == False)
        .all()
    )

    return offers


# ===============================
# UPDATE OFFER
# ===============================


@router.put("/{offer_id}")
def update_offer(
    offer_id: int,
    data: OfferUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    offer = (
        db.query(Offer)
        .join(Campaign, Offer.campaign_id == Campaign.id)
        .filter(
            Offer.id == offer_id,
            Campaign.user_id == current_user.id,
            Offer.is_deleted == False,
        )
        .first()
    )

    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    offer.campaign_id = data.campaign_id
    offer.name = data.name
    offer.url = data.url
    offer.weight = data.weight
    offer.redirect_mode = data.redirect_mode

    db.commit()
    db.refresh(offer)

    return {"message": "Offer updated successfully", "offer_id": offer.id}


# ===============================
# DELETE OFFER
# ===============================


@router.delete("/{offer_id}")
def delete_offer(
    offer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    offer = (
        db.query(Offer)
        .join(Campaign, Offer.campaign_id == Campaign.id)
        .filter(
            Offer.id == offer_id,
            Campaign.user_id == current_user.id,
            Offer.is_deleted == False,
        )
        .first()
    )

    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    offer.is_deleted = True
    offer.is_active = False

    # remove rule_offer relations
    db.query(RuleOffer).filter(RuleOffer.offer_id == offer_id).delete()

    db.commit()

    return {"message": "Offer archived successfully"}


@router.put("/{offer_id}/toggle")
def toggle_offer(
    offer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    offer = (
        db.query(Offer)
        .join(Campaign, Offer.campaign_id == Campaign.id)
        .filter(
            Offer.id == offer_id,
            Campaign.user_id == current_user.id,
            Offer.is_deleted == False,
        )
        .first()
    )

    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    # Toggle status
    offer.is_active = not offer.is_active

    db.commit()
    db.refresh(offer)

    return {"id": offer.id, "is_active": offer.is_active}
