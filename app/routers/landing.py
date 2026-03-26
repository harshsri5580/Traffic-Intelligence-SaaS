from fastapi import APIRouter, HTTPException
from app.services.token_service import (
    decode_secure_token,
    is_token_used,
    mark_token_used,
)
from app.services.redis_client import redis_client


router = APIRouter(prefix="/api/landing", tags=["Landing Protection"])


@router.get("/validate")
def validate_landing(token: str, ip: str, ua: str):

    # ---------------------------
    # Challenge Verification
    # ---------------------------

    challenge_key = f"challenge_pass:{ip}"

    try:

        challenge_pass = redis_client.get(challenge_key)

    except Exception:

        challenge_pass = None

    if not challenge_pass:

        raise HTTPException(status_code=403, detail="Challenge not passed")

    # ---------------------------
    # Replay Protection
    # ---------------------------

    if is_token_used(token):

        raise HTTPException(status_code=403, detail="Token already used")

    # ---------------------------
    # Token Validation
    # ---------------------------

    try:

        url = decode_secure_token(token, ip, ua)

    except Exception:

        raise HTTPException(status_code=403, detail="Invalid token")

    # ---------------------------
    # Mark Token Used
    # ---------------------------

    mark_token_used(token)

    return {"status": "ok", "redirect_url": url}
