from typing import List
from fastapi import WebSocket

connections: List[WebSocket] = []


# ===============================
# CONNECT
# ===============================
async def connect(websocket: WebSocket):
    connections.append(websocket)
    # print(f"✅ WS CONNECTED: {len(connections)}")


# ===============================
# DISCONNECT
# ===============================
def disconnect(websocket: WebSocket):
    try:
        connections.remove(websocket)
    except ValueError:
        pass

    # print(f"❌ WS DISCONNECTED: {len(connections)}")


# ===============================
# BROADCAST
# ===============================
async def broadcast(data):
    dead_connections = []

    for ws in connections:
        try:
            await ws.send_json(data)
        except Exception as e:
            # print("⚠️ WS ERROR:", e)
            dead_connections.append(ws)

    # cleanup
    for ws in dead_connections:
        try:
            connections.remove(ws)
        except ValueError:
            pass

    # print(f"📡 BROADCAST TO: {len(connections)}")
