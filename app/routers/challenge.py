import hashlib

from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import HTMLResponse, JSONResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.campaign import Campaign
from app.services.redis_client import redis_client
from app.services.visitor_context import VisitorContext


router = APIRouter(tags=["Challenge"])


def get_real_ip(request: Request):
    ip = request.headers.get("x-forwarded-for")
    if ip:
        return ip.split(",")[0].strip()
    return request.client.host


# ================= CHALLENGE PAGE =================


@router.get("/challenge/{slug}", response_class=HTMLResponse)
async def challenge_page(slug: str, request: Request, db: Session = Depends(get_db)):

    campaign = (
        db.query(Campaign)
        .filter(
            Campaign.slug == slug,
            Campaign.is_active == True,
            Campaign.is_deleted == False,
        )
        .first()
    )

    if not campaign:
        raise HTTPException(status_code=404, detail="Campaign not found")

    html = f"""
<!DOCTYPE html>
<html>
<head>
<title>Loading...</title>
<meta charset="UTF-8">
<style>
body {{
margin:0;
background:#fff;
}}
</style>
</head>

<body>

<script>

function detectBot(){{
let score = 0;

// webdriver
if(navigator.webdriver) score += 50;

// headless signals
if(window._phantom || window.callPhantom) score += 50;

// plugins
if(!navigator.plugins || navigator.plugins.length === 0) score += 20;

// languages
if(!navigator.languages || navigator.languages.length === 0) score += 20;

// chrome check
if(window.chrome && !window.chrome.runtime) score += 10;

return score;
}}

async function runChallenge(){{
try{{
const botScore = detectBot();

const res = await fetch("/api/challenge/verify", {{
method: "POST",
headers: {{ "Content-Type": "application/json" }},
body: JSON.stringify({{
botScore: botScore,
userAgent: navigator.userAgent
}})
}});

const result = await res.json();

if(result.status === "ok"){{
window.location.replace("/r/{slug}");
}}else{{
window.location.replace("/"); // safe fallback
}}

}}catch(e){{
window.location.replace("/");
}}
}}

runChallenge();

</script>

</body>
</html>
"""

    return HTMLResponse(content=html)


# ================= VERIFY CHALLENGE =================


@router.post("/api/challenge/verify")
async def verify_challenge(request: Request):

    data = await request.json()

    ip = get_real_ip(request)

    # 🔥 SIMPLE BOT SCORE (FAST + EFFECTIVE)
    score = 0

    # webdriver
    if data.get("webdriver"):
        score += 50

    # automation
    if data.get("automationScore", 0) > 20:
        score += 40

    # devtools
    if data.get("devtools"):
        score += 20

    # plugins missing
    if data.get("plugins", 0) == 0:
        score += 10

    # languages missing
    if not data.get("languages"):
        score += 20

    # 🔥 NEW (invisible challenge support)
    if data.get("botScore", 0) > 50:
        score += 50

    # ================= BLOCK =================
    if score >= 70:
        return {"status": "blocked"}

    # ================= PASS =================

    # 🔥 OPTIONAL fingerprint (lightweight)
    fp_string = f"{data.get('userAgent')}-{data.get('platform')}-{data.get('language')}"
    fp_hash = hashlib.sha256(fp_string.encode()).hexdigest()[:16]

    redis_client.set(f"fp:{ip}", fp_hash, ex=300)

    # 🔥 MAIN PASS KEY
    redis_client.set(f"challenge_pass:{ip}", 1, ex=600)  # 🔥 10 min

    return {"status": "ok"}
