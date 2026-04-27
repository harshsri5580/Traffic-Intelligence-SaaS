import csv, os, zipfile
from datetime import datetime, timedelta
from collections import defaultdict

from app.models.click_log import ClickLog

REPORT_DIR = "reports"
os.makedirs(REPORT_DIR, exist_ok=True)


def generate_user_report(db, user_id):

    cutoff = datetime.utcnow() - timedelta(days=7)

    logs = (
        db.query(ClickLog)
        .filter(ClickLog.user_id == user_id, ClickLog.created_at >= cutoff)
        .all()
    )

    # 🔥 AGGREGATE DATA
    summary = defaultdict(lambda: {"clicks": 0, "revenue": 0, "cost": 0, "blocked": 0})

    for l in logs:
        cid = l.campaign_id

        summary[cid]["clicks"] += 1

        # safe fallback (avoid crash)
        summary[cid]["revenue"] += getattr(l, "revenue", 0) or 0
        summary[cid]["cost"] += getattr(l, "cost", 0) or 0

        if getattr(l, "blocked", False):
            summary[cid]["blocked"] += 1

    # 🔥 FILE NAME
    filename = f"{REPORT_DIR}/user_{user_id}_{int(datetime.utcnow().timestamp())}.csv"

    with open(filename, "w", newline="") as f:
        writer = csv.writer(f)

        writer.writerow(["Campaign", "Clicks", "Revenue", "Cost", "Profit", "Blocked"])

        for cid, data in summary.items():
            profit = data["revenue"] - data["cost"]

            writer.writerow(
                [
                    cid,
                    data["clicks"],
                    round(data["revenue"], 2),
                    round(data["cost"], 2),
                    round(profit, 2),
                    data["blocked"],
                ]
            )

    # 🔥 ZIP
    zip_path = filename.replace(".csv", ".zip")

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
        z.write(filename, os.path.basename(filename))

    os.remove(filename)

    return zip_path
