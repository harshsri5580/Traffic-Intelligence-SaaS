from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from database import Base


class BlockedIP(Base):
    __tablename__ = "blocked_ips"

    id = Column(Integer, primary_key=True, index=True)
    ip_address = Column(String, unique=True, index=True)
    reason = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
