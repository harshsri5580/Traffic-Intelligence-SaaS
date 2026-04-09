from sqlalchemy.orm import Session
from app.models.traffic_filter import TrafficFilter


def check_traffic_filters(visitor, db: Session, user_id: int):

    # ✅ only current user filters
    filters = (
        db.query(TrafficFilter)
        .filter(TrafficFilter.is_active == True, TrafficFilter.user_id == user_id)
        .all()
    )

    # ✅ normalize visitor data once (performance boost)
    ip = (visitor.ip or "").strip().lower()
    isp = (visitor.isp or "").strip().lower()
    ua = (visitor.user_agent_string or "").strip().lower()
    ref = (visitor.referrer or "").strip().lower()

    for f in filters:

        value = (f.value or "").strip().lower()

        # 🔥 IP (exact match)
        if f.category == "ip" and ip == value:
            return True

        # 🔥 ISP (partial match)
        if f.category == "isp" and value in isp:
            return True

        # 🔥 USER AGENT (partial match)
        if f.category == "ua" and value in ua:
            return True

        # 🔥 DOMAIN (referrer check)
        if f.category == "domain" and value in ref:
            return True

    return False
