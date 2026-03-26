from sqlalchemy import Column, Integer, Float, DateTime, String
from sqlalchemy.sql import func
from app.database import Base


class Conversion(Base):

    __tablename__ = "conversions"

    id = Column(Integer, primary_key=True, index=True)

    click_id = Column(String, index=True)

    offer_id = Column(Integer)
    campaign_id = Column(Integer)

    payout = Column(Float, default=0)
    revenue = Column(Float, default=0)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
