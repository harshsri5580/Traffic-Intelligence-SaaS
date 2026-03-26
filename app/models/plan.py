from sqlalchemy import Column, Integer, String, Boolean
from app.database import Base


class Plan(Base):
    __tablename__ = "plans"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, unique=True)

    price = Column(Integer)  # monthly price

    max_campaigns = Column(Integer)
    max_rules = Column(Integer)
    max_offers = Column(Integer)

    max_monthly_clicks = Column(Integer, nullable=True)

    enable_cloaker = Column(Boolean, default=True)
    enable_proxy = Column(Boolean, default=True)
    enable_vpn_detection = Column(Boolean, default=True)

    is_active = Column(Boolean, default=True)

    # 🔥 ADD THIS (IMPORTANT)
    paddle_price_id = Column(String, nullable=True)
