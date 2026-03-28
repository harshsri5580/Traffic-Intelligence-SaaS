from sqlalchemy import Column, Integer, DateTime, ForeignKey, String, Boolean
from sqlalchemy.orm import relationship
from app.database import Base
import datetime


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), index=True)
    plan_id = Column(Integer, ForeignKey("plans.id"), index=True)

    status = Column(String, default="active")
    # active / cancelled / expired / past_due

    start_date = Column(DateTime, default=datetime.datetime.utcnow)
    expire_date = Column(DateTime)

    stripe_customer_id = Column(String, nullable=True)
    stripe_subscription_id = Column(String, nullable=True)

    auto_renew = Column(Boolean, default=True)

    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # relationships
    user = relationship("User")
    plan = relationship("Plan")
