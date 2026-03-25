from sqlalchemy import Column, Integer, String
from database import Base


class TrafficSource(Base):

    __tablename__ = "traffic_sources"

    id = Column(Integer, primary_key=True, index=True)

    name = Column(String, unique=True, nullable=False)
