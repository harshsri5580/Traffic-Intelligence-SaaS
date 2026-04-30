import os
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from app.routers.auth import get_current_user

router = APIRouter(prefix="/reports")

REPORT_DIR = "reports"


# 🔒 SAFE PATH CHECK
def get_safe_path(filename: str):
    if ".." in filename or "/" in filename or "\\" in filename:
        raise HTTPException(status_code=400, detail="Invalid filename")

    return os.path.join(REPORT_DIR, filename)


# ===============================
# 📊 LIST REPORTS (USER BASED)
# ===============================
@router.get("/")
def list_reports(current_user=Depends(get_current_user)):

    user_id = current_user.id

    if not os.path.exists(REPORT_DIR):
        return {"reports": []}

    files = os.listdir(REPORT_DIR)

    # 🔒 only user files
    user_files = [f for f in files if f.startswith(f"user_{user_id}_")]

    return {"reports": user_files}


# ===============================
# ⬇ DOWNLOAD REPORT
# ===============================
@router.get("/download/{filename}")
def download_report(filename: str, current_user=Depends(get_current_user)):

    user_id = current_user.id

    # 🔥 ensure user only accesses own file
    if not filename.startswith(f"user_{user_id}_"):
        raise HTTPException(status_code=403, detail="Unauthorized")

    path = os.path.join(REPORT_DIR, filename)

    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")

    return FileResponse(path, filename=filename)


# ===============================
# 🗑 DELETE REPORT
# ===============================
@router.delete("/delete/{filename}")
def delete_report(filename: str, current_user=Depends(get_current_user)):

    user_id = current_user.id

    # 🔒 ownership check
    if not filename.startswith(f"user_{user_id}_"):
        raise HTTPException(status_code=403, detail="Not allowed")

    path = get_safe_path(filename)

    if not os.path.exists(path):
        raise HTTPException(status_code=404, detail="File not found")

    os.remove(path)

    return {"message": "Deleted successfully"}
