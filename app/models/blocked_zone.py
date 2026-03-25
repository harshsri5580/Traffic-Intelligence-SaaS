from sqlalchemy import Column, Integer, String
from database import Base


class BlockedZone(Base):
    __tablename__ = "blocked_zones"

    id = Column(Integer, primary_key=True)
    campaign_id = Column(Integer, index=True)
    zone_id = Column(String, index=True)
