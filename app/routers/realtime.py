from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.realtime_service import connect, disconnect
import asyncio

router = APIRouter()


@router.websocket("/dashboard/live")
async def websocket_live(websocket: WebSocket):

    await websocket.accept()
    await connect(websocket)

    # print("✅ WS CONNECTED")

    try:
        while True:
            await asyncio.sleep(25)
            await websocket.send_json({"type": "ping"})

    except (WebSocketDisconnect, RuntimeError):
        print("❌ WS DISCONNECTED")

    finally:
        disconnect(websocket)
