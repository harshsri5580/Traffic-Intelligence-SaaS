from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Rule(Base):
    __tablename__ = "rules"

    id = Column(Integer, primary_key=True, index=True)

    campaign_id = Column(
        Integer, ForeignKey("campaigns.id", ondelete="CASCADE"), nullable=False
    )

    name = Column(String, nullable=False)

    # lower number = higher priority
    priority = Column(Integer, nullable=False, default=1)

    # block / rotate
    action_type = Column(String, nullable=False)

    is_active = Column(Boolean, default=True)
    match_type = Column(String, default="AND")

    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    conditions = relationship(
        "RuleCondition", back_populates="rule", cascade="all, delete-orphan"
    )

    offers = relationship(
        "RuleOffer", back_populates="rule", cascade="all, delete-orphan"
    )
