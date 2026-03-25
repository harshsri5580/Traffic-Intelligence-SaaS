from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from pydantic import BaseModel

from app.database import get_db
from app.models.rule import Rule
from app.models.campaign import Campaign
from app.models.user import User
from app.models.rule_condition import RuleCondition
from app.models.offer import Offer
from app.models.rule_offer import RuleOffer
from app.dependencies.auth import get_current_user

router = APIRouter(prefix="/api/rules", tags=["Rules"])


# ================================
# SCHEMAS
# ================================


class RuleCreateSchema(BaseModel):
    campaign_id: int
    name: str
    priority: int = 1
    action_type: str
    match_type: str = "AND"  # 🔥 ADD THIS


class RuleUpdateSchema(BaseModel):
    name: str
    action_type: str
    priority: int = 1
    match_type: str = "AND"  # 🔥 ADD THIS


class RuleConditionSchema(BaseModel):
    field: str
    operator: str
    value: str
    condition_group: int = 1


class RuleOfferAttachSchema(BaseModel):
    offer_id: int
    weight: int = 100


class RuleToggleSchema(BaseModel):
    is_active: bool


# ================================
# CREATE RULE
# ================================


@router.post("/")
def create_rule(
    payload: RuleCreateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    campaign = (
        db.query(Campaign)
        .filter(
            Campaign.id == payload.campaign_id,
            Campaign.user_id == current_user.id,
            Campaign.is_deleted == False,
        )
        .first()
    )

    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    rule = Rule(
        campaign_id=payload.campaign_id,
        name=payload.name,
        priority=payload.priority,
        action_type=payload.action_type,
        match_type=payload.match_type,
        is_active=True,
        created_at=datetime.utcnow(),
    )

    db.add(rule)
    db.commit()
    db.refresh(rule)

    return {"rule_id": rule.id}


# ================================
# LIST RULES
# ================================


@router.get("/campaign/{campaign_id}")
def list_rules(
    campaign_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    campaign = (
        db.query(Campaign)
        .filter(Campaign.id == campaign_id, Campaign.user_id == current_user.id)
        .first()
    )

    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    rules = (
        db.query(Rule)
        .filter(Rule.campaign_id == campaign_id)
        .order_by(Rule.priority.asc())
        .all()
    )

    result = []

    for rule in rules:

        conditions = (
            db.query(RuleCondition).filter(RuleCondition.rule_id == rule.id).all()
        )

        offers = (
            db.query(RuleOffer, Offer)
            .join(Offer, RuleOffer.offer_id == Offer.id)
            .filter(RuleOffer.rule_id == rule.id, Offer.is_deleted == False)
            .all()
        )

        result.append(
            {
                "id": rule.id,
                "name": rule.name,
                "campaign_id": rule.campaign_id,
                "priority": rule.priority,
                "match_type": rule.match_type,
                "action_type": rule.action_type,
                "is_active": rule.is_active,
                "conditions": [
                    {
                        "id": c.id,
                        "field": c.field,
                        "operator": c.operator,
                        "value": c.value,
                    }
                    for c in conditions
                ],
                "offers": [
                    {
                        "rule_offer_id": ro.id,
                        "offer_id": offer.id,
                        "offer_url": offer.url,
                        "weight": ro.weight,
                    }
                    for ro, offer in offers
                ],
            }
        )

    return result


# ================================
# RULE DETAILS
# ================================


@router.get("/{rule_id}")
def rule_details(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    rule = (
        db.query(Rule)
        .join(Campaign)
        .filter(Rule.id == rule_id, Campaign.user_id == current_user.id)
        .first()
    )

    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    conditions = db.query(RuleCondition).filter(RuleCondition.rule_id == rule_id).all()

    offers = (
        db.query(RuleOffer, Offer)
        .join(Offer, RuleOffer.offer_id == Offer.id)
        .filter(RuleOffer.rule_id == rule_id, Offer.is_deleted == False)
        .all()
    )

    return {
        "id": rule.id,
        "name": rule.name,
        "campaign_id": rule.campaign_id,
        "priority": rule.priority,
        "match_type": rule.match_type,
        "action_type": rule.action_type,
        "is_active": rule.is_active,
        "conditions": [
            {"id": c.id, "field": c.field, "operator": c.operator, "value": c.value}
            for c in conditions
        ],
        "offers": [
            {
                "rule_offer_id": ro.id,
                "offer_id": offer.id,
                "offer_url": offer.url,
                "weight": ro.weight,
            }
            for ro, offer in offers
        ],
    }


# ================================
# UPDATE RULE
# ================================


@router.put("/{rule_id}")
def update_rule(
    rule_id: int,
    payload: RuleUpdateSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    rule = (
        db.query(Rule)
        .join(Campaign)
        .filter(Rule.id == rule_id, Campaign.user_id == current_user.id)
        .first()
    )

    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    rule.name = payload.name
    rule.action_type = payload.action_type
    rule.priority = payload.priority
    rule.match_type = payload.match_type  # 🔥 ADD THIS

    db.commit()

    return {"message": "Rule updated", "rule_id": rule.id}


# ================================
# ADD CONDITION
# ================================


@router.post("/{rule_id}/conditions")
def add_condition(
    rule_id: int,
    payload: RuleConditionSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    rule = (
        db.query(Rule)
        .join(Campaign)
        .filter(Rule.id == rule_id, Campaign.user_id == current_user.id)
        .first()
    )

    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    value = payload.value

    # browser default fallback
    if payload.field == "browser" and not value:
        value = "chrome,firefox,safari,edge,opera"

    condition = RuleCondition(
        rule_id=rule_id,
        field=payload.field,
        operator=payload.operator,
        value=value,
        condition_group=payload.condition_group,
    )

    db.add(condition)
    db.commit()
    db.refresh(condition)

    return {"condition_id": condition.id}


# ================================
# DELETE ALL CONDITIONS
# ================================


@router.delete("/{rule_id}/conditions")
def delete_conditions(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    rule = (
        db.query(Rule)
        .join(Campaign)
        .filter(Rule.id == rule_id, Campaign.user_id == current_user.id)
        .first()
    )

    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    db.query(RuleCondition).filter(RuleCondition.rule_id == rule_id).delete()

    db.commit()

    return {"message": "Conditions removed"}


# ================================
# TOGGLE RULE
# ================================


@router.post("/{rule_id}/toggle")
def toggle_rule(
    rule_id: int,
    payload: RuleToggleSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    rule = (
        db.query(Rule)
        .join(Campaign)
        .filter(Rule.id == rule_id, Campaign.user_id == current_user.id)
        .first()
    )

    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    rule.is_active = payload.is_active
    db.commit()

    return {"is_active": rule.is_active}


# ================================
# ATTACH OFFER TO RULE
# ================================


@router.post("/{rule_id}/offers")
def attach_offer_to_rule(
    rule_id: int,
    payload: RuleOfferAttachSchema,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    rule = (
        db.query(Rule)
        .join(Campaign)
        .filter(Rule.id == rule_id, Campaign.user_id == current_user.id)
        .first()
    )

    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    offer = db.query(Offer).filter(Offer.id == payload.offer_id).first()

    if not offer:
        raise HTTPException(status_code=404, detail="Offer not found")

    existing = (
        db.query(RuleOffer)
        .filter(RuleOffer.rule_id == rule_id, RuleOffer.offer_id == payload.offer_id)
        .first()
    )

    if existing:
        raise HTTPException(status_code=400, detail="Offer already attached")

    rule_offer = RuleOffer(
        rule_id=rule_id,
        offer_id=payload.offer_id,
        weight=payload.weight,
        created_at=datetime.utcnow(),
    )

    db.add(rule_offer)
    db.commit()
    db.refresh(rule_offer)

    return {"rule_offer_id": rule_offer.id}


# ================================
# REMOVE OFFER FROM RULE
# ================================


@router.delete("/offers/{rule_offer_id}")
def remove_offer_from_rule(
    rule_offer_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    rule_offer = (
        db.query(RuleOffer)
        .join(Rule)
        .join(Campaign)
        .filter(RuleOffer.id == rule_offer_id, Campaign.user_id == current_user.id)
        .first()
    )

    if not rule_offer:
        raise HTTPException(status_code=404, detail="Rule offer not found")

    db.delete(rule_offer)
    db.commit()

    return {"message": "Offer removed from rule"}


# ================================
# DELETE RULE
# ================================


@router.delete("/{rule_id}")
def delete_rule(
    rule_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):

    rule = (
        db.query(Rule)
        .join(Campaign)
        .filter(Rule.id == rule_id, Campaign.user_id == current_user.id)
        .first()
    )

    if not rule:
        raise HTTPException(status_code=404, detail="Rule not found")

    if rule.is_active:
        raise HTTPException(status_code=400, detail="Active rule cannot be deleted")

    db.delete(rule)
    db.commit()

    return {"message": "Rule deleted"}
