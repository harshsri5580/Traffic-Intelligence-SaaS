from sqlalchemy import Column, Integer, Date, ForeignKey, DateTime
from sqlalchemy.sql import func

from app.database import Base


class OfferDailyStats(Base):
    __tablename__ = "offer_daily_stats"

    id = Column(Integer, primary_key=True, index=True)
    offer_id = Column(Integer, ForeignKey("offers.id", ondelete="CASCADE"))
    date = Column(Date, nullable=False)

    clicks = Column(Integer, default=0)
    unique_clicks = Column(Integer, default=0)
    bots = Column(Integer, default=0)

    created_at = Column(DateTime, server_default=func.now())