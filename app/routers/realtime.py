from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

connections = []


@router.websocket("/ws/live")
async def websocket_live(websocket: WebSocket):

    await websocket.accept()

    connections.append(websocket)

    try:

        while True:
            data = await websocket.receive_text()

    except WebSocketDisconnect:

        if websocket in connections:
            connections.remove(websocket)

        print("WebSocket disconnected")
