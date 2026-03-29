from sqlalchemy import Column, Integer, String, DateTime
from datetime import datetime
from app.database import Base


class EmailOTP(Base):
    __tablename__ = "email_otps"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, index=True)
    otp = Column(String)

    expires_at = Column(DateTime)

    created_at = Column(DateTime, default=datetime.utcnow)

    # 🔥 NEW FIELDS
    last_sent_at = Column(DateTime, default=datetime.utcnow)  # rate limit
    attempts = Column(Integer, default=0)  # retry limit
