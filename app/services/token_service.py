import base64
import hmac
import hashlib
import time
import os
from dotenv import load_dotenv
from typing import Tuple

from services.redis_client import redis_client

load_dotenv()

SECRET = os.getenv("TOKEN_SECRET", "default_secret")
EXPIRY = int(os.getenv("TOKEN_EXPIRY_SECONDS", 900))
REPLAY_TTL = int(os.getenv("TOKEN_REPLAY_TTL", 900))


# -------------------------------------------------
# 🔐 Fingerprint Generator (IP + UA)
# -------------------------------------------------
def _fingerprint(ip: str, user_agent: str) -> str:

    raw = f"{ip}|{user_agent}"

    return hashlib.sha256(raw.encode()).hexdigest()


# -------------------------------------------------
# 🔐 HMAC Sign
# -------------------------------------------------
def _sign(data: str) -> str:

    return hmac.new(SECRET.encode(), data.encode(), hashlib.sha256).hexdigest()


# -------------------------------------------------
# 🔐 Token Hash (Replay Protection)
# -------------------------------------------------
def hash_token(token: str) -> str:

    return hashlib.sha256(token.encode()).hexdigest()


# -------------------------------------------------
# 🔁 Redis Replay Check
# -------------------------------------------------
def is_token_used(token: str) -> bool:

    token_hash = hash_token(token)

    key = f"ti_used_token:{token_hash}"

    try:
        return redis_client.exists(key) == 1
    except Exception:
        return False


# -------------------------------------------------
# 🔁 Mark Token Used
# -------------------------------------------------
def mark_token_used(token: str):

    token_hash = hash_token(token)

    key = f"ti_used_token:{token_hash}"

    try:
        redis_client.set(key, 1, ex=REPLAY_TTL)
    except Exception:
        pass


# -------------------------------------------------
# 🚀 Generate Secure Token
# -------------------------------------------------
def generate_secure_token(url: str, ip: str, user_agent: str) -> str:

    timestamp = str(int(time.time()))

    fingerprint = _fingerprint(ip, user_agent)

    payload = f"{url}|{timestamp}|{fingerprint}"

    signature = _sign(payload)

    final_payload = f"{payload}|{signature}"

    encoded = base64.urlsafe_b64encode(final_payload.encode()).decode()

    return encoded.rstrip("=")


# -------------------------------------------------
# 🔍 Decode + Validate Token
# -------------------------------------------------
def decode_secure_token(token: str, ip: str, user_agent: str) -> str:

    try:

        padding = "=" * (-len(token) % 4)

        decoded = base64.urlsafe_b64decode(token + padding).decode()

    except Exception:

        raise Exception("Invalid token encoding")

    try:

        url, timestamp, fingerprint, signature = decoded.split("|")

    except ValueError:

        raise Exception("Invalid token structure")

    # -------------------------------
    # Signature Check
    # -------------------------------

    expected_signature = _sign(f"{url}|{timestamp}|{fingerprint}")

    if not hmac.compare_digest(signature, expected_signature):

        raise Exception("Token tampered")

    # -------------------------------
    # Expiry Check
    # -------------------------------

    if int(time.time()) - int(timestamp) > EXPIRY:

        raise Exception("Token expired")

    # -------------------------------
    # Fingerprint Check
    # -------------------------------

    current_fp = _fingerprint(ip, user_agent)

    if not hmac.compare_digest(fingerprint, current_fp):

        raise Exception("Fingerprint mismatch")

    return url


# -------------------------------------------------
# 🔎 Debug Utility
# -------------------------------------------------
def inspect_token(token: str) -> Tuple[str, int]:

    padding = "=" * (-len(token) % 4)

    decoded = base64.urlsafe_b64decode(token + padding).decode()

    url, timestamp, *_ = decoded.split("|")

    return url, int(timestamp)
