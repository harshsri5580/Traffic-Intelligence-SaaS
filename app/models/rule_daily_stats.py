from sqlalchemy import Column, Integer, Date, ForeignKey, DateTime
from sqlalchemy.sql import func

from app.database import Base


class RuleDailyStats(Base):
    __tablename__ = "rule_daily_stats"

    id = Column(Integer, primary_key=True, index=True)
    rule_id = Column(Integer, ForeignKey("rules.id", ondelete="CASCADE"))
    date = Column(Date, nullable=False)

    matches = Column(Integer, default=0)
    blocked = Column(Integer, default=0)
    passed = Column(Integer, default=0)

    created_at = Column(DateTime, server_default=func.now())
