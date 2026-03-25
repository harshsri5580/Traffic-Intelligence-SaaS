from sqlalchemy.orm import Session
from models.traffic_filter import TrafficFilter


def check_traffic_filters(visitor, db: Session):

    filters = db.query(TrafficFilter).filter(TrafficFilter.is_active == True).all()

    for f in filters:

        value = f.value.lower()

        if f.category == "domain":

            if visitor.referrer and value in visitor.referrer.lower():
                return True

        if f.category == "isp":

            if visitor.isp and value in visitor.isp.lower():
                return True

        if f.category == "ua":

            if visitor.user_agent_string and value in visitor.user_agent_string.lower():
                return True

        if f.category == "ip":

            if visitor.ip == value:
                return True

    return False
