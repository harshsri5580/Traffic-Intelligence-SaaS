from sqlalchemy.orm import Session
from app.models.traffic_filter import TrafficFilter


def check_traffic_filters(visitor, db: Session, user_id: int):

    filters = (
        db.query(TrafficFilter)
        .filter(TrafficFilter.is_active == True, TrafficFilter.user_id == user_id)
        .all()
    )

    ip = (visitor.ip or "").strip().lower()
    isp = " ".join((visitor.isp or "").lower().split())
    # 🔥 DEBUG ADD HERE
    print("ISP RAW:", repr(visitor.isp))
    print("ISP CLEAN:", repr(isp))

    ua = (visitor.user_agent_string or "").strip().lower()
    ref = (visitor.referrer or "").strip().lower()
    print("🔍 ISP:", isp)
    print(
        "🔍 FILTERS:",
        [(f.category, f.value, getattr(f, "filter_type", "block")) for f in filters],
    )

    # 🔥 DEFAULT
    visitor.is_whitelisted = False

    # =========================================
    # 🔥 STEP 1: WHITELIST CHECK (HIGH PRIORITY)
    # =========================================
    for f in filters:

        if (f.filter_type or "block") != "allow":
            continue

        value = " ".join((f.value or "").lower().split())

        if f.category == "ip" and ip == value:
            visitor.is_whitelisted = True
            break

        if f.category == "isp" and value in isp:
            print("✅ ALLOW HIT:", value, isp)
            visitor.is_whitelisted = True
            print("🔥 FINAL WHITELIST STATUS:", visitor.is_whitelisted)
            break

        if f.category == "ua" and value in ua:
            visitor.is_whitelisted = True
            break

        if f.category == "domain" and value in ref:
            visitor.is_whitelisted = True
            break

    # 🔥 FORCE EXIT IF WHITELISTED
    if visitor.is_whitelisted:
        return False

    # =========================================
    # 🔥 STEP 2: BLOCK CHECK
    # =========================================
    for f in filters:

        if (f.filter_type or "block") != "block":
            continue

        value = (f.value or "").strip().lower()

        if f.category == "ip" and ip == value:
            return True

        if f.category == "isp" and value in isp:
            print("❌ BLOCK HIT:", value, isp)
            return True

        if f.category == "ua" and value in ua:
            return True

        if f.category == "domain" and value in ref:
            return True

    # =========================================
    # ✅ SAFE TRAFFIC
    # =========================================
    return False
