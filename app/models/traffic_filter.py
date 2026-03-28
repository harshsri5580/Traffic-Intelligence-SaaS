from sqlalchemy import Column, Integer, String, Boolean, ForeignKey
from app.database import Base


class TrafficFilter(Base):

    __tablename__ = "traffic_filters"

    id = Column(Integer, primary_key=True, index=True)

    category = Column(String, nullable=False)
    value = Column(String, nullable=False)

    is_active = Column(Boolean, default=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
