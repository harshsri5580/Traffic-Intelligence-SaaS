from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from database import Base
import datetime


class RawHitLog(Base):
    __tablename__ = "raw_hit_logs"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id"))

    # basic request data
    ip = Column(String)
    user_agent = Column(String)
    path = Column(String)

    # geo data
    country = Column(String)
    region = Column(String)
    city = Column(String)

    # device data
    browser = Column(String)
    os = Column(String)
    device_type = Column(String)

    # traffic intelligence
    traffic_source = Column(String)
    traffic_medium = Column(String)

    # network intelligence
    ip_type = Column(String)
    connection_type = Column(String)
    asn = Column(String)
    org = Column(String)

    # bot detection
    bot_score = Column(Integer)
    is_bot = Column(String)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)
