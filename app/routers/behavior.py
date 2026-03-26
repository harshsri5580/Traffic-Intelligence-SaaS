from fastapi import APIRouter, Request
from pydantic import BaseModel
from app.services.redis_client import redis_client

router = APIRouter(tags=["Behavior"])


class BehaviorData(BaseModel):
    mouse: int = 0
    scroll: int = 0
    click: int = 0
    time: int = 0


@router.post("/track")
async def track_behavior(data: BehaviorData, request: Request):
    try:
        ip = request.client.host

        key = f"behavior:{ip}"

        # 🔥 store in Redis (safe update)
        redis_client.hincrby(key, "mouse_moves", data.mouse)
        redis_client.hincrby(key, "scrolls", data.scroll)
        redis_client.hincrby(key, "clicks", data.click)

        redis_client.expire(key, 300)  # 5 min TTL

        return {"status": "ok"}

    except Exception:
        return {"status": "error"}
