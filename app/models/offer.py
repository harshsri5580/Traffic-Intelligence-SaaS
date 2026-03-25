from sqlalchemy import Column, Integer, String, ForeignKey, Boolean, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime

from database import Base


class Offer(Base):
    __tablename__ = "offers"

    # =========================
    # Basic Fields
    # =========================

    id = Column(Integer, primary_key=True, index=True)

    campaign_id = Column(
        Integer,
        ForeignKey("campaigns.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    url = Column(String, nullable=False)
    name = Column(String, nullable=False)

    # Traffic weight for rotation
    weight = Column(Integer, default=1)

    # Offer active / paused
    is_active = Column(Boolean, default=True)

    # Redirect mode (proxy / direct / token)
    redirect_mode = Column(String, default="proxy")

    # Soft delete (never actually removed from DB)
    is_deleted = Column(Boolean, default=False, nullable=False)

    created_at = Column(DateTime, default=datetime.utcnow)

    # =========================
    # Relationships
    # =========================

    campaign = relationship("Campaign", back_populates="offers")

    rule_links = relationship(
        "RuleOffer", back_populates="offer", cascade="all, delete-orphan"
    )
