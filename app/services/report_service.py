import csv
import os
import zipfile
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

    # ===============================
    # 🔥 AGGREGATIONS
    # ===============================

    campaign_summary = defaultdict(
        lambda: {"clicks": 0, "revenue": 0.0, "cost": 0.0, "blocked": 0}
    )

    country_summary = defaultdict(lambda: {"clicks": 0, "revenue": 0.0, "cost": 0.0})

    device_summary = defaultdict(lambda: {"clicks": 0, "revenue": 0.0, "cost": 0.0})

    # ===============================
    # 🔥 PROCESS LOGS (SINGLE LOOP = FAST)
    # ===============================
    for l in logs:
        cid = getattr(l, "campaign_id", "unknown")
        country = getattr(l, "country_code", "unknown") or "unknown"
        device = getattr(l, "device", "unknown") or "unknown"

        revenue = float(getattr(l, "revenue", 0) or 0)
        cost = float(getattr(l, "cost", 0) or 0)

        is_blocked = getattr(l, "blocked", False)

        # -------- Campaign --------
        campaign_summary[cid]["clicks"] += 1
        campaign_summary[cid]["revenue"] += revenue
        campaign_summary[cid]["cost"] += cost

        if is_blocked:
            campaign_summary[cid]["blocked"] += 1

        # -------- Country --------
        country_summary[country]["clicks"] += 1
        country_summary[country]["revenue"] += revenue
        country_summary[country]["cost"] += cost

        # -------- Device --------
        device_summary[device]["clicks"] += 1
        device_summary[device]["revenue"] += revenue
        device_summary[device]["cost"] += cost

    # ===============================
    # 🔥 FILE NAME
    # ===============================
    timestamp = int(datetime.utcnow().timestamp())
    filename = f"{REPORT_DIR}/user_{user_id}_{timestamp}.csv"

    # ===============================
    # 🔥 WRITE CSV
    # ===============================
    with open(filename, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)

        # =====================
        # 📊 CAMPAIGN SUMMARY
        # =====================
        writer.writerow(["Campaign Summary"])
        writer.writerow(["Campaign", "Clicks", "Revenue", "Cost", "Profit", "Blocked"])

        for cid, data in sorted(campaign_summary.items()):
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

        writer.writerow([])

        # =====================
        # 🌍 COUNTRY PERFORMANCE
        # =====================
        writer.writerow(["Country Performance"])
        writer.writerow(["Country", "Clicks", "Revenue", "Cost", "Profit"])

        for country, data in sorted(
            country_summary.items(), key=lambda x: -x[1]["clicks"]
        ):
            profit = data["revenue"] - data["cost"]

            writer.writerow(
                [
                    country,
                    data["clicks"],
                    round(data["revenue"], 2),
                    round(data["cost"], 2),
                    round(profit, 2),
                ]
            )

        writer.writerow([])

        # =====================
        # 📱 DEVICE PERFORMANCE
        # =====================
        writer.writerow(["Device Performance"])
        writer.writerow(["Device", "Clicks", "Revenue", "Cost", "Profit"])

        for device, data in sorted(device_summary.items()):
            profit = data["revenue"] - data["cost"]

            writer.writerow(
                [
                    device,
                    data["clicks"],
                    round(data["revenue"], 2),
                    round(data["cost"], 2),
                    round(profit, 2),
                ]
            )

    # ===============================
    # 📦 ZIP FILE
    # ===============================
    zip_path = filename.replace(".csv", ".zip")

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as z:
        z.write(filename, os.path.basename(filename))

    # 🧹 remove raw csv
    os.remove(filename)

    return zip_path
