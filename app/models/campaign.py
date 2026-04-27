from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from app.database import Base


class Campaign(Base):
    __tablename__ = "campaigns"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)

    slug = Column(String, unique=True, nullable=False, index=True)

    fallback_url = Column(String, nullable=True)
    safe_page_url = Column(String, nullable=True)
    bot_url = Column(String, nullable=True)
    tracking_domain = Column(String, nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    is_deleted = Column(Boolean, default=False, nullable=False)

    user_id = Column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )

    created_at = Column(DateTime, default=datetime.utcnow)

    traffic_source = Column(String, nullable=True, index=True)

    # 🔥 FIXED (IMPORTANT)
    sub1 = Column(String, nullable=True)
    sub2 = Column(String, nullable=True)

    traffic_network = Column(String, nullable=True, index=True)

    # ================= ROUTING CONFIG =================

    device_routes = Column(JSON, nullable=True)
    timezone_routes = Column(JSON, nullable=True)
    referrer_routes = Column(JSON, nullable=True)
    traffic_splits = Column(JSON, nullable=True)

    block_vpn = Column(Boolean, default=True)
    block_proxy = Column(Boolean, default=True)
    block_tor = Column(Boolean, default=True)
    block_datacenter = Column(Boolean, default=True)
    block_automation = Column(Boolean, default=True)
    block_canvas = Column(Boolean, default=False)

    returning_visitor_url = Column(String, nullable=True)

    # ================= AUTO OPTIMIZATION =================

    auto_optimize = Column(Boolean, default=False)

    roi_threshold = Column(Integer, default=0)
    # example: 0 = break-even, -20 = allow loss, 20 = profit target

    auto_status = Column(String, default="active")
    # active / blocked / scaled

    last_optimized_at = Column(DateTime, nullable=True)

    # ----------------------
    # Relationships
    # ----------------------
    user = relationship("User", back_populates="campaigns")
    offers = relationship(
        "Offer", back_populates="campaign", cascade="all, delete-orphan"
    )
