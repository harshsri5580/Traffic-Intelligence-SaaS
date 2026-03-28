from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base


class TrafficSource(Base):

    __tablename__ = "traffic_sources"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
