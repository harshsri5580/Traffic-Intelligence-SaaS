from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    ForeignKey,
    DateTime,
    Text,
    Float,
)
from datetime import datetime
from database import Base


class ClickLog(Base):
    __tablename__ = "click_logs"

    id = Column(Integer, primary_key=True, index=True)
    click_id = Column(String, unique=True, index=True, nullable=False)

    campaign_id = Column(Integer, ForeignKey("campaigns.id"))
    user_id = Column(Integer, ForeignKey("users.id"))
    rule_id = Column(Integer, ForeignKey("rules.id"), nullable=True)
    offer_id = Column(Integer, ForeignKey("offers.id"), nullable=True)

    # ======================
    # Basic Geo Data
    # ======================

    ip_address = Column(String)
    country = Column(String)
    country_code = Column(String(10))
    region = Column(String)
    city = Column(String)

    # ======================
    # User Agent Intelligence
    # ======================

    user_agent = Column(Text)
    browser = Column(String(100))
    os = Column(String(100))
    device_type = Column(String(50))
    language = Column(String(50))
    ip_timezone = Column(String(100))

    # ======================
    # Network Intelligence
    # ======================

    asn = Column(String(50))
    isp = Column(String(150))
    org = Column(String(150))
    host = Column(String(150))
    connection_type = Column(String(50))
    ip_type = Column(String(50))

    # ======================
    # Bot Intelligence
    # ======================

    bot_score = Column(Integer, default=0)
    is_bot = Column(Boolean, default=False)

    risk_score = Column(Integer, default=0)
    fingerprint = Column(String(64))

    # ======================
    # Traffic Info
    # ======================

    referrer = Column(Text)
    query_string = Column(Text)

    traffic_source = Column(String(100))
    traffic_medium = Column(String(100))

    sub1 = Column(String, nullable=True)
    sub2 = Column(String, nullable=True)
    sub3 = Column(String, nullable=True)
    sub4 = Column(String, nullable=True)
    sub5 = Column(String, nullable=True)

    # ======================
    # Revenue Tracking 💰
    # ======================

    payout = Column(Float, default=0)  # from postback
    cost = Column(Float, default=0)  # from sub2

    # ======================
    # Decision Info
    # ======================

    status = Column(String)
    reason = Column(String)
    destination = Column(Text)

    created_at = Column(DateTime, default=datetime.utcnow)
