from passlib.context import CryptContext
import random
import secrets

# 🔐 PASSWORD HASHING
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)


def hash_password(password: str):
    return pwd_context.hash(password)


def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password, hashed_password)


# 🔢 OTP GENERATOR (SECURE)
def generate_otp():
    # random नहीं — cryptographically safe
    return str(secrets.randbelow(900000) + 100000)


# 🔐 OPTIONAL: TOKEN GENERATOR (future use)
def generate_secure_token(length: int = 32):
    return secrets.token_hex(length)
