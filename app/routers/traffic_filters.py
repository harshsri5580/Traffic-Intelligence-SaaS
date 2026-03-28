from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.traffic_filter import TrafficFilter
from pydantic import BaseModel
from app.routers.auth import get_current_user

router = APIRouter(prefix="/filters", tags=["Traffic Filters"])


class FilterCreate(BaseModel):
    category: str
    value: str


# GET ALL FILTERS
@router.get("/")
def get_filters(
    db: Session = Depends(get_db), current_user=Depends(get_current_user)  # 🔥 ADD
):
    filters = (
        db.query(TrafficFilter)
        .filter(TrafficFilter.user_id == current_user.id)  # 🔥 ADD
        .order_by(TrafficFilter.id.desc())
        .all()
    )

    return filters


# ADD FILTER
@router.post("/")
def add_filter(
    data: FilterCreate,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),  # 🔥 ADD
):
    f = TrafficFilter(
        category=data.category,
        value=data.value,
        is_active=True,
        user_id=current_user.id,  # 🔥 ADD
    )

    db.add(f)
    db.commit()
    db.refresh(f)

    return f


# DELETE FILTER
@router.delete("/{filter_id}")
def delete_filter(
    filter_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),  # 🔥 ADD
):
    f = (
        db.query(TrafficFilter)
        .filter(
            TrafficFilter.id == filter_id,
            TrafficFilter.user_id == current_user.id,  # 🔥 ADD
        )
        .first()
    )

    if not f:
        raise HTTPException(status_code=404, detail="Filter not found")

    db.delete(f)
    db.commit()

    return {"success": True}


@router.put("/{filter_id}/toggle")
def toggle_filter(
    filter_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),  # 🔥 ADD
):
    f = (
        db.query(TrafficFilter)
        .filter(
            TrafficFilter.id == filter_id,
            TrafficFilter.user_id == current_user.id,  # 🔥 ADD
        )
        .first()
    )

    if not f:
        raise HTTPException(status_code=404, detail="Filter not found")

    f.is_active = not f.is_active

    db.commit()

    return {"id": f.id, "is_active": f.is_active}
