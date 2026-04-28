from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
import logging
import app.models.whitelist_rule
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

# ✅ DATABASE (ONLY THIS)
from app.database import engine, Base, SessionLocal
from app.tasks.report_tasks import start_scheduler

# ✅ MODELS
from app.models.system_log import SystemLog
import app.models  # ✅ THIS LOADS ALL MODELS

# ✅ ROUTERS (ONLY app.)
from app.routers import (
    auth,
    campaign,
    analytics,
    offer,
    redirect,
    stats,
    admin,
    dashboard,
    rules,
    tools,
    conversions,
    landing,
    traffic_filters,
    challenge,
    decoy,
    traffic_sources,
    billing,
    realtime,
    user,
    behavior,
    reports,
)

# Models (important for table creation)
# from app.models import raw_hit_log
# from app.models import used_token


# ===============================
# LOGGING
# ===============================

logging.basicConfig(
    level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s"
)


# ===============================
# CREATE DATABASE TABLES
# ===============================

Base.metadata.create_all(bind=engine)


# ===============================
# INIT FASTAPI
# ===============================

app = FastAPI(title="Traffic Intelligence SaaS", version="1.0")


# ===============================
# CORS (FRONTEND CONNECTION)
# ===============================

# REMOVE THIS ❌
# db = SessionLocal()

# COMMENT THIS ❌
# Base.metadata.create_all(bind=engine)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        # ✅ NEW FRONTEND
        "https://trafficintelai.com",
        "https://www.trafficintelai.com",
        # ✅ NEW API (optional but safe)
        "https://api.trafficintelai.com",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ===============================
# RATE LIMIT KEY
# ===============================


def user_rate_limit_key(request: Request):

    user = getattr(request.state, "user", None)

    if user:
        return str(user.id)

    return get_remote_address(request)


# ===============================
# RATE LIMITER
# ===============================

limiter = Limiter(key_func=user_rate_limit_key)

app.state.limiter = limiter

app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


# ===============================
# GLOBAL ERROR HANDLER
# ===============================


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):

    try:
        db = SessionLocal()

        log = SystemLog(type="ERROR", message=f"{request.url.path} - {str(exc)}")

        db.add(log)
        db.commit()
        db.close()

    except Exception as e:
        print("Logging failed:", e)

    return JSONResponse(status_code=500, content={"detail": "Internal Server Error"})


# ===============================
# ROUTERS
# ===============================

app.include_router(auth.router, prefix="/api/auth")
app.include_router(reports.router, prefix="/api")  # ✅ ADD THIS

app.include_router(admin.router, prefix="/api/admin")
app.include_router(billing.router, prefix="/api")

app.include_router(stats.router, prefix="/api/stats")

app.include_router(campaign.router, prefix="/api/campaigns")
app.include_router(traffic_sources.router, prefix="/api")

app.include_router(traffic_filters.router, prefix="/api")

app.include_router(offer.router, prefix="/api/offers")
app.include_router(realtime.router, prefix="/api")

# rules router already has prefix inside file
app.include_router(rules.router)

app.include_router(dashboard.router, prefix="/api/dashboard")

app.include_router(redirect.router)
app.include_router(conversions.router)
app.include_router(user.router, prefix="/api")

app.include_router(analytics.router)

app.include_router(landing.router)
app.include_router(challenge.router)
app.include_router(decoy.router)
app.include_router(tools.router, prefix="/api")
app.include_router(behavior.router, prefix="/api/behavior")
app.include_router(reports.router, prefix="/api")

# ===============================
# ROOT ENDPOINT
# ===============================


@app.get("/")
def root():
    return {"message": "Traffic Intelligence SaaS running 🚀"}


# ===============================
# STARTUP EVENT
# ===============================


@app.on_event("startup")
async def startup_event():
    logging.info("🚀 Traffic Intelligence SaaS started")
    start_scheduler()
