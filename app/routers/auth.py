from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from datetime import datetime, timedelta
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from app.services.email_service import send_email

# ✅ NEW
from app.core.config import SECRET_KEY, ALGORITHM
from app.database import get_db
from app.models.user import User
from app.services.security import hash_password, verify_password
from app.models.system_log import SystemLog
import re
from app.models.email_otp import EmailOTP
from app.services.security import generate_otp
from app.models.subscription import Subscription
from app.models.plan import Plan
from app.core.config import FREE_TRIAL_ENABLED

# 🚫 TEMP EMAIL BLOCK LIST
TEMP_EMAIL_DOMAINS = {
    "mailinator.com",
    "10minutemail.com",
    "tempmail.com",
    "guerrillamail.com",
    "yopmail.com",
    "trashmail.com",
    "sharklasers.com",
    "grr.la",
    "guerrillamailblock.com",
    "fakeinbox.com",
    "maildrop.cc",
    "getnada.com",
    "tempmailo.com",
    "dispostable.com",
    "emailondeck.com",
}

TEMP_KEYWORDS = [
    "temp",
    "fake",
    "trash",
    "mailinator",
    "guerrilla",
    "disposable",
    "burner",
]
from app.models.system_settings import SystemSettings
from pydantic import BaseModel


# 👇 ये add कर
class RegisterRequest(BaseModel):
    name: str  # ✅ ADD
    email: str
    password: str


router = APIRouter(tags=["Auth"])

ACCESS_TOKEN_EXPIRE_MINUTES = 180

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


def create_access_token(data: dict):
    to_encode = data.copy()

    expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})

    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


@router.post("/register")
def register(data: RegisterRequest, db: Session = Depends(get_db)):

    email = data.email.strip().lower()
    password = data.password

    # 🔒 REGISTRATION TOGGLE (ADMIN CONTROL)
    settings = db.query(SystemSettings).first()
    if settings and hasattr(settings, "registration_enabled"):
        if not settings.registration_enabled:
            raise HTTPException(status_code=403, detail="Registration disabled")

    # 📧 EMAIL VALIDATION
    email_regex = r"^[\w\.-]+@[\w\.-]+\.\w+$"
    if not re.match(email_regex, email):
        raise HTTPException(status_code=400, detail="Invalid email format")

    # 🚫 TEMP EMAIL CHECK
    domain = email.split("@")[-1]

    # 🚫 exact domain block
    if domain in TEMP_EMAIL_DOMAINS:
        raise HTTPException(400, "Temporary email not allowed")

    # 🚫 keyword based detection
    for keyword in TEMP_KEYWORDS:
        if keyword in domain:
            raise HTTPException(400, "Temporary email not allowed")

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
    new_user = User(
        name=data.name,
        email=email,
        hashed_password=hashed,
        role="member",
        is_verified=False,
    )
    otp = generate_otp()

    otp_entry = EmailOTP(
        email=email, otp=otp, expires_at=datetime.utcnow() + timedelta(minutes=10)
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # 🔥 FREE TRIAL CONTROL (PRODUCTION SAFE)

    if FREE_TRIAL_ENABLED:
        free_plan = db.query(Plan).filter(Plan.name == "Basic").first()

        if free_plan:
            trial = Subscription(
                user_id=new_user.id,
                plan_id=free_plan.id,
                start_date=datetime.utcnow(),
                expire_date=datetime.utcnow() + timedelta(days=7),
                status="active",
            )

            db.add(trial)
            db.commit()

            print(f"🎁 Trial activated for {new_user.email}")
    else:
        print("🚫 Free trial disabled")

    db.add(otp_entry)
    db.commit()

    print(f"🔐 OTP for {email}: {otp}")
    send_email(email, otp)

    # 🧾 LOG
    log = SystemLog(type="INFO", message=f"New user registered: {new_user.email}")
    db.add(log)
    db.commit()

    return {"message": "User registered successfully"}


class LoginRequest(BaseModel):
    email: str
    password: str


@router.post("/login")
def login(data: LoginRequest, db: Session = Depends(get_db)):

    email = data.email.strip().lower()
    password = data.password

    user = db.query(User).filter(User.email == email).first()

    # ❌ INVALID USER / PASSWORD
    if not user or not verify_password(password, user.hashed_password):

        # 🔴 FAIL LOG
        log = SystemLog(type="WARNING", message=f"Failed login attempt for {email}")
        db.add(log)
        db.commit()

        raise HTTPException(status_code=401, detail="Invalid credentials")

    # 🚫 EMAIL NOT VERIFIED
    # 🚫 EMAIL NOT VERIFIED (ONLY FOR NON-ADMIN)
    if user.role != "admin" and not user.is_verified:
        raise HTTPException(status_code=403, detail="Please verify your email first")
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


@router.get("/create-admin")
def create_admin(db: Session = Depends(get_db)):
    from app.services.security import hash_password

    email = "admin@gmail.com"
    password = "admin123"

    existing = db.query(User).filter(User.email == email).first()
    if existing:
        return {"message": "Admin already exists"}

    user = User(
        email=email,
        hashed_password=hash_password(password),
        role="admin",
        is_verified=True,
    )

    db.add(user)
    db.commit()

    return {"message": "Admin created"}


class VerifyOTPRequest(BaseModel):
    email: str
    otp: str


@router.post("/verify-email")
def verify_email(data: VerifyOTPRequest, db: Session = Depends(get_db)):

    record = (
        db.query(EmailOTP)
        .filter(EmailOTP.email == data.email, EmailOTP.otp == data.otp)
        .first()
    )

    if not record:
        raise HTTPException(400, "Invalid OTP")

    if record.expires_at < datetime.utcnow():
        raise HTTPException(400, "OTP expired")

    user = db.query(User).filter(User.email == data.email).first()

    user.is_verified = True
    db.commit()

    return {"message": "Email verified successfully"}


class ResendOTPRequest(BaseModel):
    email: str


@router.post("/resend-otp")
def resend_otp(data: ResendOTPRequest, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.email == data.email).first()

    if not user:
        raise HTTPException(404, "User not found")

    if user.is_verified:
        raise HTTPException(400, "Email already verified")

    otp = generate_otp()

    otp_entry = EmailOTP(
        email=data.email, otp=otp, expires_at=datetime.utcnow() + timedelta(minutes=10)
    )

    db.add(otp_entry)
    db.commit()

    # 📧 EMAIL SEND (next step)
    send_email(data.email, otp)

    return {"message": "OTP resent successfully"}


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordRequest(BaseModel):
    email: str
    otp: str
    new_password: str


@router.post("/forgot-password")
def forgot_password(data: ForgotPasswordRequest, db: Session = Depends(get_db)):

    user = db.query(User).filter(User.email == data.email).first()

    if not user:
        raise HTTPException(404, "User not found")

    otp = generate_otp()

    otp_entry = EmailOTP(
        email=data.email, otp=otp, expires_at=datetime.utcnow() + timedelta(minutes=10)
    )

    db.add(otp_entry)
    db.commit()

    send_email(data.email, otp)

    return {"message": "OTP sent"}


@router.post("/reset-password")
def reset_password(data: ResetPasswordRequest, db: Session = Depends(get_db)):

    record = (
        db.query(EmailOTP)
        .filter(EmailOTP.email == data.email, EmailOTP.otp == data.otp)
        .first()
    )

    if not record:
        raise HTTPException(400, "Invalid OTP")

    if record.expires_at < datetime.utcnow():
        raise HTTPException(400, "OTP expired")

    user = db.query(User).filter(User.email == data.email).first()

    user.hashed_password = hash_password(data.new_password)
    db.commit()

    return {"message": "Password reset successful"}
