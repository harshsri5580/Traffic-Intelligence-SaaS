from typing import List
from fastapi import WebSocket

connections: List[WebSocket] = []


async def connect(websocket: WebSocket):

    connections.append(websocket)

    print("WS CONNECTED:", len(connections))


def disconnect(websocket: WebSocket):

    if websocket in connections:
        connections.remove(websocket)

    print("WS DISCONNECTED:", len(connections))


async def broadcast(data):

    dead_connections = []

    for ws in connections:

        try:
            await ws.send_json(data)

        except:
            dead_connections.append(ws)

    for ws in dead_connections:
        connections.remove(ws)
