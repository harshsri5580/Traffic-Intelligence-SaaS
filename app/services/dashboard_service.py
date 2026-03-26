from sqlalchemy import func
from app.models.campaign_daily_stats import CampaignDailyStats
from app.models.offer_daily_stats import OfferDailyStats


class DashboardService:

    @staticmethod
    def campaign_performance(db, campaign_id: int):

        stats = (
            db.query(
                func.sum(CampaignDailyStats.total_clicks),
                func.sum(CampaignDailyStats.passed),
                func.sum(CampaignDailyStats.blocked),
                func.sum(CampaignDailyStats.fallback),
                func.sum(CampaignDailyStats.bots),
            )
            .filter(CampaignDailyStats.campaign_id == campaign_id)
            .first()
        )

        total = stats[0] or 0
        passed = stats[1] or 0

        ctr = (passed / total * 100) if total > 0 else 0

        return {
            "total_clicks": total,
            "passed": passed,
            "blocked": stats[2] or 0,
            "fallback": stats[3] or 0,
            "bots": stats[4] or 0,
            "ctr": round(ctr, 2),
        }
