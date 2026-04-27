import os
from fastapi import APIRouter, Depends
from fastapi.responses import FileResponse
from app.database import get_db

router = APIRouter()

REPORT_DIR = "reports"


@router.get("/")
def list_reports(user_id: int = 0):
    files = os.listdir(REPORT_DIR)

    if user_id:
        files = [f for f in files if f.startswith(f"user_{user_id}_")]

    return files


@router.get("/reports/download/{filename}")
def download_report(filename: str):
    path = f"{REPORT_DIR}/{filename}"
    return FileResponse(path, filename=filename)
