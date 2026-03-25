from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from datetime import datetime, timedelta
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

from core.config import SECRET_KEY, ALGORITHM
from ..database import get_db
from ..models.user import User
from ..services.security import hash_password, verify_password
from models.system_log import SystemLog
import re
from models.system_settings import SystemSettings


router = APIRouter(tags=["Auth"])

ACCESS_TOKEN_EXPIRE_MINUTES = 60

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def create_access_token(data: dict):
    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/register")
def register(email: str, password: str, db: Session = Depends(get_db)):

    # 🔒 REGISTRATION TOGGLE (ADMIN CONTROL)
    settings = db.query(SystemSettings).first()
    if settings and hasattr(settings, "registration_enabled"):
        if not settings.registration_enabled:
            raise HTTPException(status_code=403, detail="Registration disabled")

    # 📧 EMAIL VALIDATION
    email_regex = r"^[\w\.-]+@[\w\.-]+\.\w+$"
    if not re.match(email_regex, email):
        raise HTTPException(status_code=400, detail="Invalid email format")

    # 🔐 PASSWORD VALIDATION (STRONGER)
    if len(password) < 6:
        raise HTTPException(
            status_code=400, detail="Password must be at least 6 characters"
        )

    # 🔁 DUPLICATE CHECK
    existing_user = db.query(User).filter(User.email == email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # 🔑 HASH PASSWORD
    hashed = hash_password(password)

    # 👤 DEFAULT ROLE
    new_user = User(email=email, hashed_password=hashed, role="member")

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 🧾 LOG
    log = SystemLog(type="INFO", message=f"New user registered: {new_user.email}")
    db.add(log)
    db.commit()

    return {"message": "User registered successfully"}


@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)
):

    email = form_data.username.strip().lower()
    password = form_data.password

    user = db.query(User).filter(User.email == email).first()

    # ❌ INVALID USER / PASSWORD
    if not user or not verify_password(password, user.hashed_password):

        # 🔴 FAIL LOG
        log = SystemLog(type="WARNING", message=f"Failed login attempt for {email}")
        db.add(log)
        db.commit()

        raise HTTPException(status_code=401, detail="Invalid credentials")

    # 🚫 BLOCKED USER CHECK
    if user.role == "blocked":
        raise HTTPException(status_code=403, detail="Account is blocked")

    # 🔐 TOKEN CREATE
    access_token = create_access_token(data={"sub": str(user.id), "role": user.role})

    # ✅ SUCCESS LOG
    log = SystemLog(type="INFO", message=f"User {user.email} logged in")
    db.add(log)
    db.commit()

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {"id": user.id, "email": user.email, "role": user.role},
    }


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
):

    credentials_exception = HTTPException(
        status_code=401, detail="Could not validate credentials"
    )

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("sub")

        if user_id is None:
            raise credentials_exception

    except JWTError:
        raise credentials_exception

    user = db.query(User).filter(User.id == int(user_id)).first()

    if user is None:
        raise credentials_exception

    # 🚫 BLOCK CHECK
    if user.role == "blocked":
        raise HTTPException(status_code=403, detail="User blocked")

    return user
