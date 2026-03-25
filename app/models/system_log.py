from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.database import Base


class SystemLog(Base):
    __tablename__ = "system_logs"

    id = Column(Integer, primary_key=True, index=True)

    type = Column(String, nullable=False)  # INFO / ERROR / WARNING
    message = Column(String, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)
