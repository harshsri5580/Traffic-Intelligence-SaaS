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
    # MAIN ROUTING ENTRY (SMART PRIORITY)
    # =====================================================

    def evaluate(self) -> Optional[str]:

        # 🔥 Priority-based routing (Adspect style)

        for method in [
            self.device_routing,
            self.country_routing,
            self.timezone_routing,
            self.referrer_routing,
            self.returning_visitor_routing,
            self.smart_offer_routing,
            self.traffic_split_routing,
        ]:
            try:
                url = method()
                if url:
                    return self.safe_url(url)
            except Exception:
                continue

        return None

    # =====================================================
    # DEVICE ROUTING
    # =====================================================

    def device_routing(self) -> Optional[str]:

        device = getattr(self.visitor, "device_type", None)

        if not device:
            return None

        device_map = getattr(self.campaign, "device_routes", None)

        if not isinstance(device_map, dict):
            return None

        return device_map.get(str(device).lower())

    # =====================================================
    # COUNTRY ROUTING
    # =====================================================

    def country_routing(self) -> Optional[str]:

        country = getattr(self.visitor, "country_code", None)

        if not country:
            return None

        routes = getattr(self.campaign, "country_routes", None)

        if not isinstance(routes, dict):
            return None

        return routes.get(str(country).upper())

    # =====================================================
    # TIMEZONE ROUTING
    # =====================================================

    def timezone_routing(self) -> Optional[str]:

        timezone = getattr(self.visitor, "ip_timezone", None)

        routes = getattr(self.campaign, "timezone_routes", None)

        if not timezone or not isinstance(routes, dict):
            return None

        return routes.get(timezone)

    # =====================================================
    # REFERRER ROUTING
    # =====================================================

    def referrer_routing(self) -> Optional[str]:

        source = getattr(self.visitor, "traffic_source", None)

        routes = getattr(self.campaign, "referrer_routes", None)

        if not source or not isinstance(routes, dict):
            return None

        return routes.get(str(source).lower())

    # =====================================================
    # RETURNING VISITOR
    # =====================================================

    def returning_visitor_routing(self) -> Optional[str]:

        if getattr(self.visitor, "is_returning", False):
            return getattr(self.campaign, "returning_visitor_url", None)

        return None

    # =====================================================
    # SMART OFFER ROTATION (AI-like)
    # =====================================================

    def smart_offer_routing(self) -> Optional[str]:

        if not self.db:
            return None

        if not getattr(self.campaign, "smart_rotation", False):
            return None

        try:
            offer = select_best_offer(self.db, self.campaign.id)
            return getattr(offer, "url", None) if offer else None
        except Exception:
            return None

    # =====================================================
    # TRAFFIC SPLIT (CONSISTENT + SAFE)
    # =====================================================

    def traffic_split_routing(self) -> Optional[str]:

        splits = getattr(self.campaign, "traffic_splits", None)

        if not isinstance(splits, list) or not splits:
            return None

        urls = []
        weights = []

        for item in splits:
            if not isinstance(item, dict):
                continue

            url = item.get("url")
            weight = item.get("weight", 1)

            if url:
                urls.append(url)
                weights.append(max(weight, 1))

        if not urls:
            return None

        visitor_id = getattr(self.visitor, "ip", None) or str(random.random())

        seed = self.hash_seed(visitor_id)

        # ✅ Local random instance (NO global pollution)
        rnd = random.Random(seed)

        return rnd.choices(urls, weights=weights, k=1)[0]

    # =====================================================
    # STEALTH SAFE URL (ADVANCED 🔥)
    # =====================================================

    def safe_url(self, url: str) -> Optional[str]:

        if not url:
            return None

        # optional cloaking param (harder detection)
        try:
            if "?" in url:
                return f"{url}&_r={self.random_token()}"
            else:
                return f"{url}?_r={self.random_token()}"
        except Exception:
            return url

    # =====================================================
    # HASH SEED (CONSISTENT USER)
    # =====================================================

    def hash_seed(self, value: str) -> int:
        h = hashlib.md5(value.encode()).hexdigest()
        return int(h[:8], 16)

    # =====================================================
    # RANDOM TOKEN (ANTI-DETECTION)
    # =====================================================

    def random_token(self) -> str:
        return hashlib.md5(str(random.random()).encode()).hexdigest()[:8]
