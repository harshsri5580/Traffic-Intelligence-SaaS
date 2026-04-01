from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.campaign import Campaign

router = APIRouter(prefix="/tools", tags=["Tools"])


@router.get("/script/{slug}")
def generate_script(slug: str, request: Request, db: Session = Depends(get_db)):

    domain = (
        request.headers.get("x-forwarded-host")
        or request.headers.get("host")
        or "traffic-intelligence-saas.onrender.com"
    )

    domain = f"https://{domain}"

    campaign = db.query(Campaign).filter(Campaign.slug == slug).first()

    source = (
        campaign.traffic_source if campaign and campaign.traffic_source else "direct"
    )

    redirect_url = f"{domain}/r/{slug}?utm_source={source}&utm_medium=paid"

    return {
        "direct_link": redirect_url,
        "php_script": f"""<?php
header("Location: {redirect_url}");
exit;
?>""",
        "js_loader": f"""<script>
fetch("{redirect_url}")
.then(r => r.json())
.then(d => {{
window.location = d.redirect
}})
</script>""",
        "iframe_cloak": f"""<iframe src="{redirect_url}" width="100%" height="100%" frameborder="0"></iframe>""",
        "wordpress_snippet": f"""add_action('template_redirect', function() {{
wp_redirect('{redirect_url}');
exit;
}});""",
    }
