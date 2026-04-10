from fastapi import APIRouter, Request
from pydantic import BaseModel
from app.services.behavior_tracker import track_behavior

router = APIRouter(tags=["Behavior"])


class BehaviorData(BaseModel):
    mouse: int = 0
    scroll: int = 0
    click: int = 0
    time: int = 0


@router.post("/track")
async def track_behavior_api(data: BehaviorData, request: Request):
    print("🔥 BEHAVIOR API HIT")
    try:
        ip = request.headers.get("x-forwarded-for")

        if ip:
            ip = ip.split(",")[0].strip()
        else:
            ip = request.client.host
        ua = request.headers.get("user-agent", "")
        print("IP:", ip)
        print("UA:", ua)
        print("DATA:", data.dict())

        # 🔥 ONLY THIS (no duplicate logic)
        track_behavior(ip, ua, data.dict())

        return {"status": "ok"}

    except Exception as e:
        return {"status": "error", "msg": str(e)}
