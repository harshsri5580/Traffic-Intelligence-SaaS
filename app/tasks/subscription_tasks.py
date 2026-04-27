from datetime import datetime, timezone
from app.database import SessionLocal
from app.models.subscription import Subscription


def expire_subscriptions():
    db = SessionLocal()

    try:
        now = datetime.now(timezone.utc)  # ✅ FIXED (timezone safe)

        expired_subs = (
            db.query(Subscription)
            .filter(
                Subscription.status == "active",
                Subscription.expire_date != None,  # ✅ safety
                Subscription.expire_date < now,
            )
            .all()
        )

        for sub in expired_subs:
            sub.status = "expired"
            print(f"⛔ Expired subscription for user {sub.user_id}")

        db.commit()

    except Exception as e:
        print("❌ Error in expire_subscriptions:", str(e))

    finally:
        db.close()


# 🔥 OPTIONAL TEST RUN (SAFE)
if __name__ == "__main__":
    expire_subscriptions()
