import random
from sqlalchemy.orm import Session
from sqlalchemy import func

from models.offer import Offer
from models.rule_offer import RuleOffer
from models.offer_daily_stats import OfferDailyStats


# =========================================
# RULE BASED OFFER ROTATION
# =========================================
def choose_offer_for_rule(db: Session, rule_id: int):

    results = (
        db.query(RuleOffer, Offer)
        .join(Offer, Offer.id == RuleOffer.offer_id)
        .filter(
            RuleOffer.rule_id == rule_id,
            Offer.is_active == True,
            Offer.is_deleted == False,
        )
        .all()
    )

    if not results:
        return None

    offers = []
    weights = []

    for ro, offer in results:

        weight = ro.weight if ro.weight else 1

        offers.append(offer)
        weights.append(weight)

    return random.choices(offers, weights=weights, k=1)[0]


# =========================================
# CAMPAIGN LEVEL ROTATION
# =========================================
def choose_offer_for_campaign(db: Session, campaign_id: int):

    offers = (
        db.query(Offer)
        .filter(
            Offer.campaign_id == campaign_id,
            Offer.is_active == True,
            Offer.is_deleted == False,
        )
        .all()
    )

    if not offers:
        return None

    weights = [o.weight if o.weight else 1 for o in offers]

    return random.choices(offers, weights=weights, k=1)[0]


# =========================================
# SMART AI ROTATION (EPC BASED)
# =========================================
def choose_offer_smart(db: Session, campaign_id: int):

    offers = (
        db.query(Offer)
        .filter(
            Offer.campaign_id == campaign_id,
            Offer.is_active == True,
            Offer.is_deleted == False,
        )
        .all()
    )

    if not offers:
        return None

    offers_list = []
    weights = []

    for offer in offers:

        stats = (
            db.query(
                func.sum(OfferDailyStats.clicks),
                func.sum(OfferDailyStats.conversions),
            )
            .filter(OfferDailyStats.offer_id == offer.id)
            .first()
        )

        clicks = stats[0] or 0
        conversions = stats[1] or 0

        # -------------------------
        # EPC calculation
        # -------------------------
        if clicks == 0:
            weight = offer.weight if offer.weight else 1
        else:
            epc = conversions / clicks
            weight = max(epc * 100, 1)

        offers_list.append(offer)
        weights.append(weight)

    return random.choices(offers_list, weights=weights, k=1)[0]


# =========================================
# MAIN ROTATION ENTRY
# =========================================
def choose_offer(db: Session, campaign_id: int, mode: str = "weight"):

    if mode == "ai":
        offer = choose_offer_smart(db, campaign_id)

        if offer:
            return offer

    return choose_offer_for_campaign(db, campaign_id)
