from sqlalchemy import Column, Integer, Date, ForeignKey, DateTime
from sqlalchemy.sql import func

from database import Base


class CampaignDailyStats(Base):
    __tablename__ = "campaign_daily_stats"

    id = Column(Integer, primary_key=True, index=True)
    campaign_id = Column(Integer, ForeignKey("campaigns.id", ondelete="CASCADE"))
    date = Column(Date, nullable=False)

    total_clicks = Column(Integer, default=0)
    unique_clicks = Column(Integer, default=0)
    blocked = Column(Integer, default=0)
    passed = Column(Integer, default=0)
    fallback = Column(Integer, default=0)
    bots = Column(Integer, default=0)

    created_at = Column(DateTime, server_default=func.now())
