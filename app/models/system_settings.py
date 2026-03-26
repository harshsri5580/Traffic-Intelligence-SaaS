from sqlalchemy import Column, Integer, Boolean
from app.database import Base


class SystemSettings(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)

    max_campaigns = Column(Integer, default=10)
    max_offers = Column(Integer, default=50)
    max_rules = Column(Integer, default=100)

    maintenance_mode = Column(Boolean, default=False)
    registration_enabled = Column(Boolean, default=True)
