from sqlalchemy import Column, Integer, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class RuleOffer(Base):
    __tablename__ = "rule_offers"

    id = Column(Integer, primary_key=True, index=True)

    rule_id = Column(
        Integer, ForeignKey("rules.id", ondelete="CASCADE"), nullable=False
    )

    offer_id = Column(
        Integer, ForeignKey("offers.id", ondelete="CASCADE"), nullable=False
    )

    weight = Column(Integer, default=100, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    rule = relationship("Rule", back_populates="offers")

    offer = relationship("Offer", back_populates="rule_links")
