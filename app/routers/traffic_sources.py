from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.traffic_source import TrafficSource
from app.routers.auth import get_current_user

router = APIRouter(prefix="/sources", tags=["Traffic Sources"])


# ✅ GET SOURCES (USER-WISE)
@router.get("/")
def get_sources(
    db: Session = Depends(get_db), current_user=Depends(get_current_user)  # 🔥
):
    return (
        db.query(TrafficSource)
        .filter(TrafficSource.user_id == current_user.id)  # 🔥
        .order_by(TrafficSource.id.desc())
        .all()
    )


# ✅ ADD SOURCE (USER-WISE)
@router.post("/")
def add_source(
    name: str,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),  # 🔥
):
    exists = (
        db.query(TrafficSource)
        .filter(
            TrafficSource.name == name, TrafficSource.user_id == current_user.id  # 🔥
        )
        .first()
    )

    if exists:
        raise HTTPException(status_code=400, detail="Source already exists")

    source = TrafficSource(name=name, user_id=current_user.id)  # 🔥

    db.add(source)
    db.commit()
    db.refresh(source)

    return source


# ✅ DELETE SOURCE (SAFE)
@router.delete("/{source_id}")
def delete_source(
    source_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),  # 🔥
):
    source = (
        db.query(TrafficSource)
        .filter(
            TrafficSource.id == source_id,
            TrafficSource.user_id == current_user.id,  # 🔥
        )
        .first()
    )

    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    db.delete(source)
    db.commit()

    return {"message": "Source deleted"}
