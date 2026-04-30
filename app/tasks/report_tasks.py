# app/tasks/report_tasks.py

from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler

from app.database import SessionLocal
from app.models.click_log import ClickLog
from app.models.user import User

from app.services.report_service import generate_user_report
from app.tasks.subscription_tasks import expire_subscriptions


def daily_report_and_cleanup():
    db = SessionLocal()

    try:
        users = db.query(User).all()

        for user in users:
            try:
                generate_user_report(db, user.id)
                print(f"📊 Report generated for user {user.id}")
            except Exception as e:
                print(f"❌ Report failed for user {user.id}:", e)

        # 🔥 ALWAYS AFTER REPORT
        cutoff = datetime.utcnow() - timedelta(days=7)

        deleted = db.query(ClickLog).filter(ClickLog.created_at < cutoff).delete()

        db.commit()

        print(f"🧹 Deleted {deleted} old logs")

    except Exception as e:
        print("❌ Master job error:", e)

    finally:
        db.close()


# ===============================
# 🚀 START SCHEDULER
# ===============================
scheduler = None  # 🔥 prevent duplicate start


def start_scheduler():
    global scheduler

    if scheduler:
        print("⚠️ Scheduler already running")
        return

    scheduler = BackgroundScheduler()

    # 🔥 DAILY JOBS
    scheduler.add_job(
        expire_subscriptions,
        "interval",
        hours=24,
        id="expire_subs",
        replace_existing=True,
    )

    scheduler.add_job(
        daily_report_and_cleanup,
        "interval",
        hours=24,
        id="report_cleanup",
        replace_existing=True,
    )

    scheduler.start()

    print("🚀 Scheduler started (reports + cleanup + subscriptions)")
