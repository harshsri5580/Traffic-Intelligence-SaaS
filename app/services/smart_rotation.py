from sqlalchemy.orm import Session
from sqlalchemy import func
import random
import math

from models.offer import Offer
from models.click_log import ClickLog


MIN_CLICKS_FOR_CONFIDENCE = 20
EXPLORATION_RATE = 0.1
SMOOTHING_FACTOR = 5


def select_best_offer(db: Session, campaign_id: int):

    offers = (
        db.query(Offer)
        .filter(Offer.campaign_id == campaign_id, Offer.active == True)
        .all()
    )

    if not offers:
        return None

    offer_ids = [o.id for o in offers]

    stats = (
        db.query(
            ClickLog.offer_id,
            func.count(ClickLog.id).label("clicks"),
            func.sum(ClickLog.revenue).label("revenue"),
        )
        .filter(ClickLog.offer_id.in_(offer_ids))
        .group_by(ClickLog.offer_id)
        .all()
    )

    stats_map = {s.offer_id: s for s in stats}

    scored_offers = []

    for offer in offers:

        stat = stats_map.get(offer.id)

        clicks = stat.clicks if stat else 0
        revenue = stat.revenue if stat and stat.revenue else 0

        # basic epc
        if clicks == 0:
            epc = 0
        else:
            epc = revenue / clicks

        # smoothing to prevent early bias
        smoothed_epc = (revenue + SMOOTHING_FACTOR) / (clicks + SMOOTHING_FACTOR)

        # exploration bonus for new offers
        if clicks < MIN_CLICKS_FOR_CONFIDENCE:
            exploration_bonus = EXPLORATION_RATE
        else:
            exploration_bonus = 0

        score = smoothed_epc + exploration_bonus

        scored_offers.append((offer, score))

    # normalize scores
    total_score = sum(s[1] for s in scored_offers)

    if total_score == 0:
        return random.choice(offers)

    offers_list = [o[0] for o in scored_offers]
    weights = [s[1] / total_score for s in scored_offers]

    selected_offer = random.choices(offers_list, weights=weights, k=1)[0]

    return selected_offer
