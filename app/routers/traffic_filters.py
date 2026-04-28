from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.traffic_filter import TrafficFilter
from pydantic import BaseModel
from app.routers.auth import get_current_user
from app.models.blocked_ip import BlockedIP

router = APIRouter(prefix="/filters", tags=["Traffic Filters"])


class FilterCreate(BaseModel):
    category: str
    value: str
    filter_type: str = "block"


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
    clean_value = data.value.strip().lower()
    # 🔥 CHECK duplicate (ADD THIS)
    existing = (
        db.query(TrafficFilter)
        .filter(
            TrafficFilter.category == data.category,
            TrafficFilter.value == clean_value,
            TrafficFilter.user_id == current_user.id,
        )
        .first()
    )

    if existing:
        if existing.filter_type == data.filter_type:
            return existing  # same → ignore

        # ❌ conflict block vs allow
        raise HTTPException(
            status_code=400,
            detail="Same value can't be in Block & Allow",
        )  # already exists → no duplicate

    # ✅ create new
    f = TrafficFilter(
        category=data.category,
        value=clean_value,
        filter_type=data.filter_type,  # ✅ ADD
        is_active=True,
        user_id=current_user.id,
    )

    # 🔥 AUTO SYNC WITH BlockedIP (ONLY FOR BLOCK)
    if data.category == "ip" and data.filter_type == "block":

        exists_block = (
            db.query(BlockedIP).filter(BlockedIP.ip_address == clean_value).first()
        )

        if not exists_block:
            db.add(BlockedIP(ip_address=clean_value))

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
    # 🔥 ALSO remove from BlockedIP (MAIN FIX)
    blocked = db.query(BlockedIP).filter(BlockedIP.ip_address == f.value).first()

    if blocked:
        db.delete(blocked)
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
