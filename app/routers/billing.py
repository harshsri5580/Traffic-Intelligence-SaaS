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

PADDLE_API_KEY = os.getenv("PADDLE_API_KEY")
print("API KEY:", PADDLE_API_KEY)  # DEBUG


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
        return {
            "subscription": None,
            "plan": None,
            "days_left": 0,
            "expired": True,
        }

    if sub.expire_date and sub.expire_date < datetime.utcnow():
        sub.status = "expired"
        db.commit()

        return {
            "subscription": None,
            "plan": None,
            "days_left": 0,
            "expired": True,
        }

    days_left = 0

    if sub.expire_date:
        days_left = max(0, (sub.expire_date - datetime.utcnow()).days)

    return {
        "id": sub.id,
        "status": sub.status,
        "start_date": sub.start_date,
        "expire_date": sub.expire_date,
        "days_left": days_left,
        "expired": False,
        "plan": {
            "name": sub.plan.name,
            "price": sub.plan.price,
            "max_campaigns": sub.plan.max_campaigns,
            "max_monthly_clicks": sub.plan.max_monthly_clicks,
        },
    }


# ======================================
# CREATE PADDLE CHECKOUT LINK (PRODUCTION READY)
# ======================================

import requests
import os
from fastapi import HTTPException, Depends
from sqlalchemy.orm import Session

PADDLE_API_KEY = os.getenv("PADDLE_API_KEY")
PADDLE_ENV = os.getenv("PADDLE_ENV", "production")  # sandbox / production


@router.post("/create-checkout/{plan_id}")
def create_checkout(
    plan_id: int,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user),
):

    # 🔍 Fetch Plan
    plan = db.query(Plan).filter(Plan.id == plan_id).first()

    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    if not plan.paddle_price_id:
        raise HTTPException(status_code=400, detail="Price ID not set")

    # 🌐 ENV-based Paddle URL
    if PADDLE_ENV == "sandbox":
        base_url = "https://sandbox-api.paddle.com"
    else:
        base_url = "https://api.paddle.com"

    url = f"{base_url}/transactions"

    # 🧾 Payload
    payload = {
        "items": [{"price_id": plan.paddle_price_id, "quantity": 1}],
        "customer": {"email": current_user.email},
        "checkout": {
            "url": "https://traffic-intelligence-saas.vercel.app",
            "success_url": "https://traffic-intelligence-saas.vercel.app/dashboard?payment=success",
            "cancel_url": "https://traffic-intelligence-saas.vercel.app/dashboard/pricing",
        },
    }

    # 🔐 Headers
    headers = {
        "Authorization": f"Bearer {PADDLE_API_KEY}",
        "Content-Type": "application/json",
    }

    # 🐞 DEBUG LOGS (VERY IMPORTANT)
    print("\n===== PADDLE DEBUG START =====")
    print("ENV:", PADDLE_ENV)
    print("BASE URL:", base_url)
    print("PLAN ID:", plan.id)
    print("PLAN NAME:", plan.name)
    print("PRICE ID:", plan.paddle_price_id)
    print("USER:", current_user.email)
    print("API KEY (first 10):", PADDLE_API_KEY[:10] if PADDLE_API_KEY else "MISSING")

    try:
        res = requests.post(url, json=payload, headers=headers)

        print("STATUS CODE:", res.status_code)
        print("RAW RESPONSE:", res.text)

        data = res.json()

        print("PARSED RESPONSE:", data)

        # ❌ Paddle error handle
        if "error" in data:
            raise HTTPException(
                status_code=400,
                detail=data["error"].get("detail", "Paddle error"),
            )

        # ✅ Checkout URL extraction
        checkout_url = data.get("data", {}).get("checkout", {}).get("url")

        if not checkout_url:
            raise HTTPException(
                status_code=400,
                detail="Checkout URL not generated",
            )

        print("✅ CHECKOUT URL:", checkout_url)
        print("===== PADDLE DEBUG END =====\n")

        return {
            "checkout_url": checkout_url,
            "txn_id": data.get("data", {}).get("id"),
        }

    except Exception as e:
        print("❌ PADDLE EXCEPTION:", str(e))
        raise HTTPException(status_code=500, detail="Payment failed")


# ======================================
# PADDLE WEBHOOK
# ======================================


@router.post("/webhook")
async def paddle_webhook(request: Request, db: Session = Depends(get_db)):

    data = await request.json()

    event = data.get("event_type")

    # ✅ Subscription started
    if event == "subscription.created":

        customer = data.get("data", {}).get("customer", {})
        user_id = customer.get("external_id")

        items = data.get("data", {}).get("items", [])
        price_id = items[0]["price"]["id"] if items else None

        if not user_id:
            return {"status": "no user"}

        # plan find karo
        plan = db.query(Plan).filter(Plan.paddle_price_id == price_id).first()

        if not plan:
            return {"status": "plan not found"}

        # old cancel
        old = (
            db.query(Subscription)
            .filter(
                Subscription.user_id == int(user_id),
                Subscription.status == "active",
            )
            .first()
        )

        if old:
            old.status = "cancelled"

        new_sub = Subscription(
            user_id=int(user_id),
            plan_id=plan.id,
            start_date=datetime.utcnow(),
            expire_date=datetime.utcnow() + timedelta(days=30),
            status="active",
        )

        db.add(new_sub)
        db.commit()

        print(f"✅ Paddle subscription created user {user_id}")

    # ❌ Cancel
    elif event == "subscription.canceled":

        customer = data.get("data", {}).get("customer", {})
        user_id = customer.get("external_id")

        sub = (
            db.query(Subscription)
            .filter(
                Subscription.user_id == int(user_id),
                Subscription.status == "active",
            )
            .first()
        )

        if sub:
            sub.status = "cancelled"
            db.commit()

        print(f"❌ Subscription cancelled {user_id}")

    return {"status": "ok"}


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


# @router.post("/webhook/lemonsqueezy")
# async def lemonsqueezy_webhook(request: Request, db: Session = Depends(get_db)):
#     try:
#         data = await request.json()
#         print("🔥 WEBHOOK DATA:", data)

#         event = data.get("meta", {}).get("event_name")
#         attributes = data.get("data", {}).get("attributes", {})

#         email = attributes.get("user_email")

#         if not email:
#             return {"status": "no email"}

#         user = db.query(User).filter(User.email == email).first()

#         if not user:
#             return {"status": "user not found"}

#         if event == "subscription_updated":

#             product_name = attributes.get("product_name")

#             # plan find karo DB se
#             plan = db.query(Plan).filter(Plan.name == product_name).first()

#             if not plan:
#                 print("❌ Plan not found in DB")
#                 return {"status": "plan not found"}

#             old = (
#                 db.query(Subscription)
#                 .filter(
#                     Subscription.user_id == user.id,
#                     Subscription.status == "active",
#                 )
#                 .first()
#             )

#             if old:
#                 old.status = "cancelled"

#             new_sub = Subscription(
#                 user_id=user.id,
#                 plan_id=plan.id,
#                 start_date=datetime.utcnow(),
#                 expire_date=datetime.utcnow() + timedelta(days=30),
#                 status="active",
#             )

#             db.add(new_sub)
#             db.commit()

#             print(f"✅ Subscription created for {email}: {product_name}")

#         return {"status": "ok"}

#     except Exception as e:
#         print("❌ WEBHOOK ERROR:", str(e))
#         return {"status": "error"}
