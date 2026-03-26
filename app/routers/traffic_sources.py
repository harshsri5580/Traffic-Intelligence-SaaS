from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.traffic_source import TrafficSource

router = APIRouter(prefix="/sources", tags=["Traffic Sources"])


# GET SOURCES
@router.get("/")
def get_sources(db: Session = Depends(get_db)):

    return db.query(TrafficSource).order_by(TrafficSource.id.desc()).all()


# ADD SOURCE
@router.post("/")
def add_source(name: str, db: Session = Depends(get_db)):

    exists = db.query(TrafficSource).filter(TrafficSource.name == name).first()

    if exists:
        raise HTTPException(status_code=400, detail="Source already exists")

    source = TrafficSource(name=name)

    db.add(source)
    db.commit()
    db.refresh(source)

    return source


# DELETE SOURCE
@router.delete("/{source_id}")
def delete_source(source_id: int, db: Session = Depends(get_db)):

    source = db.query(TrafficSource).filter(TrafficSource.id == source_id).first()

    if not source:
        raise HTTPException(status_code=404, detail="Source not found")

    db.delete(source)
    db.commit()

    return {"message": "Source deleted"}
