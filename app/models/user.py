from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)

    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    # 🔥 NEW FIELDS (IMPORTANT)
    name = Column(String, nullable=True)
    timezone = Column(String, default="UTC")
    webhook_url = Column(String, nullable=True)
    api_key = Column(String, nullable=True)

    role = Column(String, default="member")
    plan = Column(String, default="basic")

    created_at = Column(DateTime, default=datetime.utcnow)

    campaigns = relationship("Campaign", backref="user")
