from datetime import datetime
from app.database import SessionLocal
from app.models.subscription import Subscription


def run():
    db = SessionLocal()

    try:
        expired_subs = (
            db.query(Subscription)
            .filter(
                Subscription.status == "active",
                Subscription.expire_date < datetime.utcnow(),
            )
            .all()
        )

        for sub in expired_subs:
            sub.status = "expired"
            print(f"⛔ Expired subscription for user {sub.user_id}")

        db.commit()

    except Exception as e:
        print("❌ Error:", str(e))

    finally:
        db.close()


# 🔥 IMPORTANT ENTRYPOINT
if __name__ == "__main__":
    run()
