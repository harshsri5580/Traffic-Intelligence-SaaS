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
    cf_ip = request.headers.get("cf-connecting-ip")
    xff = request.headers.get("x-forwarded-for")
    real_ip = request.headers.get("x-real-ip")

    if cf_ip:
        return cf_ip.strip()

    if xff:
        return xff.split(",")[0].strip()

    if real_ip:
        return real_ip.strip()

    # ✅ LOCAL SAFE (IMPORTANT)
    if request.client and request.client.host in ["127.0.0.1", "localhost"]:
        return "103.46.203.161"

    return request.client.host if request.client else "0.0.0.0"


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

    html = (
        """
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
const API_BASE = "";

function detectBot(){
let score = 0;

if(navigator.webdriver) score += 50;
if(window._phantom || window.callPhantom) score += 50;
if(!navigator.plugins || navigator.plugins.length === 0) score += 20;
if(!navigator.languages || navigator.languages.length === 0) score += 20;
if(window.chrome && !window.chrome.runtime) score += 10;

return score;
}

async function runChallenge(){

if(window.__challenge_ran) return;
window.__challenge_ran = true;
const start = Date.now();
try{
const botScore = detectBot();

const res = await fetch(API_BASE + "/api/challenge/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
        botScore: botScore,
        userAgent: navigator.userAgent,
        webdriver: navigator.webdriver,
        plugins: navigator.plugins.length,
        languages: navigator.languages,
        platform: navigator.platform,
        timeTaken: Date.now() - start
    })
});

const result = await res.json();

// 🔥 delay (IMPORTANT)
setTimeout(() => {
    if(result.status === "ok"){
    window.location.replace("/r/"""
        + slug
        + """")
}
else if(result.status === "suspicious"){
    window.location.replace("/r/"""
        + slug
        + """");// 🔥 still allow
}
else{
    window.location.replace("/");
}
}, 500);

}catch(e){
window.location.replace("/");
}
}

runChallenge();
</script>

</body>
</html>
"""
    )

    return HTMLResponse(content=html)


# ================= VERIFY CHALLENGE =================


@router.post("/api/challenge/verify")
async def verify_challenge(request: Request):

    data = await request.json()

    ip = get_real_ip(request)

    # ✅ LOCAL BYPASS
    if ip in ["103.46.203.161", "127.0.0.1"]:
        response = JSONResponse({"status": "ok"})
        response.set_cookie(
            key="challenge_pass",
            value=str(ip),
            max_age=1800,
            httponly=True,
            samesite="Lax",
        )
        return response

    print("✅ CHALLENGE VERIFIED:", ip)

    # 🔥 SIMPLE BOT SCORE (FAST + EFFECTIVE)
    score = 0
    if data.get("timeTaken", 0) < 200:
        score += 40

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
        score += 20

    # languages missing
    if not data.get("languages"):
        score += 30

    # 🔥 NEW (invisible challenge support)
    if data.get("botScore", 0) > 50:
        score += 50

    # ================= BLOCK =================
    if score >= 80:
        redis_client.set(f"challenge_sus:{ip}", "1", ex=600)
        return {"status": "suspicious"}

    # ================= PASS =================

    # 🔥 OPTIONAL fingerprint (lightweight)
    fp_string = (
        f"{data.get('userAgent')}-{data.get('platform')}-{data.get('languages')}"
    )
    fp_hash = hashlib.sha256(fp_string.encode()).hexdigest()[:16]

    redis_client.set(f"fp:{ip}", fp_hash, ex=300)

    # 🔥 MAIN PASS KEY
    redis_client.set(f"challenge_pass:{ip}", "1", ex=1800)
    # print("✅ CHALLENGE PASS SET:", f"challenge_pass:{ip}")
    # print("✅ REDIS SET:", f"challenge_pass:{ip}")  # 🔥 10 min

    response = JSONResponse({"status": "ok"})

    response.set_cookie(
        key="challenge_pass", value=ip, max_age=1800, httponly=True, samesite="Lax"
    )

    return response
