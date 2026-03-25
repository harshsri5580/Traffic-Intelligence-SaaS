from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.traffic_filter import TrafficFilter
from pydantic import BaseModel

router = APIRouter(prefix="/filters", tags=["Traffic Filters"])


class FilterCreate(BaseModel):
    category: str
    value: str


# GET ALL FILTERS
@router.get("/")
def get_filters(db: Session = Depends(get_db)):

    filters = db.query(TrafficFilter).order_by(TrafficFilter.id.desc()).all()

    return filters


# ADD FILTER
@router.post("/")
def add_filter(data: FilterCreate, db: Session = Depends(get_db)):

    f = TrafficFilter(category=data.category, value=data.value, is_active=True)

    db.add(f)
    db.commit()
    db.refresh(f)

    return f


# DELETE FILTER
@router.delete("/{filter_id}")
def delete_filter(filter_id: int, db: Session = Depends(get_db)):

    f = db.query(TrafficFilter).filter(TrafficFilter.id == filter_id).first()

    if not f:
        raise HTTPException(status_code=404, detail="Filter not found")

    db.delete(f)
    db.commit()

    return {"success": True}


@router.put("/{filter_id}/toggle")
def toggle_filter(filter_id: int, db: Session = Depends(get_db)):

    f = db.query(TrafficFilter).filter(TrafficFilter.id == filter_id).first()

    if not f:
        raise HTTPException(status_code=404, detail="Filter not found")

    f.is_active = not f.is_active

    db.commit()

    return {"id": f.id, "is_active": f.is_active}
