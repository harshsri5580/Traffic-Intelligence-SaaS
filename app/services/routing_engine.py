from typing import Optional
import random
import hashlib

from sqlalchemy.orm import Session

from app.services.smart_rotation import select_best_offer


class RoutingEngine:

    def __init__(self, visitor, campaign, db: Optional[Session] = None):

        self.visitor = visitor
        self.campaign = campaign
        self.db = db

    # =====================================================
    # MAIN ROUTING ENTRY
    # =====================================================

    def evaluate(self) -> Optional[str]:

        print("ROUTING ENGINE START")
        print("Visitor Device:", self.visitor.device_type)
        print("Visitor Country:", self.visitor.country_code)

        # 1 device routing
        url = self.device_routing()
        if url:
            print("DEVICE ROUTE:", url)
            print("COUNTRY ROUTE:", url)
            return url

        # 2 country routing
        url = self.country_routing()
        if url:
            print("DEVICE ROUTE:", url)
            print("COUNTRY ROUTE:", url)
            return url

        # 3 timezone routing
        url = self.timezone_routing()
        if url:
            return url

        # 4 referrer routing
        url = self.referrer_routing()
        if url:
            return url

        # 5 returning visitor routing
        url = self.returning_visitor_routing()
        if url:
            return url

        # 6 smart offer rotation
        url = self.smart_offer_routing()
        if url:
            return url

        # 7 traffic split routing
        url = self.traffic_split_routing()
        if url:
            return url

        # fallback
        return None

    # =====================================================
    # DEVICE ROUTING
    # =====================================================

    def device_routing(self) -> Optional[str]:

        device = getattr(self.visitor, "device_type", None)

        if not device:
            return None

        device = str(device).lower()

        device_map = getattr(self.campaign, "device_routes", None)

        if not device_map:
            return None

        return device_map.get(device)

    # =====================================================
    # COUNTRY ROUTING
    # =====================================================

    def country_routing(self) -> Optional[str]:

        country = getattr(self.visitor, "country_code", None)

        if not country:
            return None

        country = str(country).upper()

        routes = getattr(self.campaign, "country_routes", None)

        if not routes:
            return None

        return routes.get(country)

    # =====================================================
    # TIMEZONE ROUTING
    # =====================================================

    def timezone_routing(self) -> Optional[str]:

        timezone = getattr(self.visitor, "ip_timezone", None)

        if not timezone:
            return None

        routes = getattr(self.campaign, "timezone_routes", None)

        if not routes:
            return None

        return routes.get(timezone)

    # =====================================================
    # REFERRER ROUTING
    # =====================================================

    def referrer_routing(self) -> Optional[str]:

        source = getattr(self.visitor, "traffic_source", None)

        if not source:
            return None

        source = str(source).lower()

        routes = getattr(self.campaign, "referrer_routes", None)

        if not routes:
            return None

        return routes.get(source)

    # =====================================================
    # RETURNING VISITOR ROUTING
    # =====================================================

    def returning_visitor_routing(self) -> Optional[str]:

        is_returning = getattr(self.visitor, "is_returning", False)

        if not is_returning:
            return None

        return getattr(self.campaign, "returning_visitor_url", None)

    # =====================================================
    # SMART OFFER ROTATION
    # =====================================================

    def smart_offer_routing(self) -> Optional[str]:

        if not self.db:
            return None

        smart_enabled = getattr(self.campaign, "smart_rotation", False)

        if not smart_enabled:
            return None

        offer = select_best_offer(self.db, self.campaign.id)

        if not offer:
            return None

        return getattr(offer, "url", None)

    # =====================================================
    # TRAFFIC SPLIT ROUTING
    # =====================================================

    def traffic_split_routing(self) -> Optional[str]:

        splits = getattr(self.campaign, "traffic_splits", None)

        if not splits:
            return None

        urls = []
        weights = []

        for item in splits:

            url = item.get("url")
            weight = item.get("weight", 1)

            if url:
                urls.append(url)
                weights.append(weight)

        if not urls:
            return None

        visitor_id = getattr(self.visitor, "ip", None)

        if not visitor_id:
            visitor_id = str(random.random())

        seed = self.hash_seed(visitor_id)

        random.seed(seed)

        return random.choices(urls, weights=weights, k=1)[0]

    # =====================================================
    # HASH SEED (CONSISTENT USER ROUTING)
    # =====================================================

    def hash_seed(self, value: str) -> int:

        h = hashlib.md5(value.encode()).hexdigest()

        return int(h[:8], 16)
