from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import os

from app.database import get_db
from app.models.plan import Plan
from app.models.subscription import Subscription
from app.models.user import User
from app.dependencies.auth import get_admin_user, get_current_user


router = APIRouter(prefix="/billing", tags=["Billing"])


# ======================================
# PADDLE CONFIG
# ======================================

PADDLE_VENDOR_ID = os.getenv("PADDLE_VENDOR_ID")
PADDLE_API_KEY = os.getenv("PADDLE_API_KEY")


# ======================================
# LIST PLANS
# ======================================


@router.get("/plans")
def get_plans(db: Session = Depends(get_db)):
    return db.query(Plan).filter(Plan.is_active == True).all()


# ======================================
# CURRENT SUBSCRIPTION
# ======================================


@router.get("/my-subscription")
def my_subscription(
    db: Session = Depends(get_db), current_user=Depends(get_current_user)
):

    sub = (
        db.query(Subscription)
        .filter(
            Subscription.user_id == current_user.id, Subscription.status == "active"
        )
        .first()
    )

    if not sub:
        return {"subscription": None}

    if sub.expire_date and sub.expire_date < datetime.utcnow():
        sub.status = "expired"
        db.commit()
        return {"subscription": None}

    return {
        "id": sub.id,
        "status": sub.status,
        "start_date": sub.start_date,
        "expire_date": sub.expire_date,
        "plan": {
            "name": sub.plan.name,
            "price": sub.plan.price,
            "max_campaigns": sub.plan.max_campaigns,
            "max_monthly_clicks": sub.plan.max_monthly_clicks,
        },
    }


# ======================================
# CREATE PADDLE CHECKOUT LINK
# ======================================


@router.post("/create-checkout/{plan_id}")
def create_checkout(
    plan_id: int, db: Session = Depends(get_db), current_user=Depends(get_current_user)
):

    plan = db.query(Plan).filter(Plan.id == plan_id, Plan.is_active == True).first()

    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    # 👉 Paddle me product/price already create hona chahiye
    if not plan.paddle_price_id:
        raise HTTPException(status_code=400, detail="Paddle price ID missing")

    return {
        "checkout_url": f"https://checkout.paddle.com/checkout/{plan.paddle_price_id}?passthrough={current_user.id}"
    }


# ======================================
# PADDLE WEBHOOK
# ======================================


@router.post("/webhook")
async def paddle_webhook(request: Request, db: Session = Depends(get_db)):

    data = await request.json()

    event_type = data.get("event_type")

    if event_type == "subscription_created":

        user_id = data.get("passthrough")
        plan_id = data.get("subscription", {}).get("plan_id")

        if not user_id:
            return {"status": "no user"}

        existing = (
            db.query(Subscription)
            .filter(
                Subscription.user_id == int(user_id), Subscription.status == "active"
            )
            .first()
        )

        if existing:
            existing.status = "cancelled"

        expire = datetime.utcnow() + timedelta(days=30)

        new_sub = Subscription(
            user_id=int(user_id),
            plan_id=int(plan_id),
            start_date=datetime.utcnow(),
            expire_date=expire,
            status="active",
        )

        db.add(new_sub)
        db.commit()

        print(f"✅ Paddle subscription created user {user_id}")

    elif event_type == "subscription_cancelled":
        print("❌ Subscription cancelled")

    return {"status": "success"}


# ======================================
# CANCEL SUBSCRIPTION
# ======================================


@router.post("/cancel")
def cancel_subscription(
    db: Session = Depends(get_db), current_user=Depends(get_current_user)
):

    sub = (
        db.query(Subscription)
        .filter(
            Subscription.user_id == current_user.id, Subscription.status == "active"
        )
        .first()
    )

    if not sub:
        raise HTTPException(status_code=404, detail="No active subscription")

    sub.status = "cancelled"
    db.commit()

    return {"message": "Subscription cancelled"}


# ======================================
# ADMIN BILLING
# ======================================


@router.get("/admin/all")
def admin_billing_data(db: Session = Depends(get_db), admin=Depends(get_admin_user)):

    data = (
        db.query(Subscription, User, Plan)
        .join(User, User.id == Subscription.user_id)
        .join(Plan, Plan.id == Subscription.plan_id)
        .all()
    )

    result = []

    for sub, user, plan in data:
        result.append(
            {
                "id": sub.id,
                "user": user.email,
                "plan": plan.name,
                "amount": plan.price,
                "status": sub.status,
                "date": sub.start_date,
            }
        )

    return result


@router.post("/subscribe/{plan_id}")
def subscribe_local(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    plan = db.query(Plan).filter(Plan.id == plan_id).first()

    if not plan:
        raise HTTPException(404, "Plan not found")

    # old sub cancel
    old = (
        db.query(Subscription)
        .filter(
            Subscription.user_id == current_user.id, Subscription.status == "active"
        )
        .first()
    )

    if old:
        old.status = "cancelled"

    new_sub = Subscription(
        user_id=current_user.id,
        plan_id=plan.id,
        start_date=datetime.utcnow(),
        expire_date=datetime.utcnow() + timedelta(days=30),
        status="active",
    )

    db.add(new_sub)
    db.commit()

    return {"message": "Subscribed successfully"}
