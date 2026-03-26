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
<title>Checking your browser.</title>
<meta charset="UTF-8">
<style>
body {{
font-family: Arial;
text-align: center;
padding-top: 80px;
}}
</style>
</head>

<body>

<h3>Checking your browser.</h3>

<script>

async function canvasFingerprint(){{
try{{
const canvas=document.createElement("canvas");
const ctx=canvas.getContext("2d");

ctx.textBaseline="top";
ctx.font="14px Arial";
ctx.fillText("fingerprint",2,2);

return canvas.toDataURL();
}}catch(e){{
return "error";
}}
}}



async function webglFingerprint(){{
try{{
const canvas=document.createElement("canvas");
const gl=canvas.getContext("webgl") || canvas.getContext("experimental-webgl");

if(!gl) return "no_webgl";

const debugInfo=gl.getExtension("WEBGL_debug_renderer_info");

if(debugInfo){{
return gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
}}

return "unknown";

}}catch(e){{
return "error";
}}
}}



function detectDevTools(){{
let threshold=160;

let widthDiff=window.outerWidth-window.innerWidth;
let heightDiff=window.outerHeight-window.innerHeight;

if(widthDiff>threshold || heightDiff>threshold){{
return true;
}}

return false;
}}



function detectAutomation(){{

let score=0;

if(navigator.webdriver) score+=50;

if(window.callPhantom) score+=50;

if(window._phantom) score+=50;

if(window.__nightmare) score+=50;

if(window.chrome && !window.chrome.runtime) score+=10;

if(!navigator.plugins || navigator.plugins.length===0) score+=20;

if(!navigator.languages || navigator.languages.length===0) score+=20;

return score;

}}



function getPermissions(){{

if(!navigator.permissions) return "unsupported";

return navigator.permissions.query({{name:"notifications"}})
.then(function(permission){{ return permission.state; }})
.catch(function(){{ return "unknown"; }});

}}



async function collectFingerprint(){{

const canvas=await canvasFingerprint();
const webgl=await webglFingerprint();
const permission=await getPermissions();

const automationScore=detectAutomation();
const devtools=detectDevTools();

return {{

webdriver:navigator.webdriver || false,

plugins:navigator.plugins ? navigator.plugins.length : 0,

languages:navigator.languages,
language:navigator.language,

platform:navigator.platform,
hardware:navigator.hardwareConcurrency,

touch:navigator.maxTouchPoints,

timezone:Intl.DateTimeFormat().resolvedOptions().timeZone,

screen:screen.width+"x"+screen.height,

canvas:canvas,
webgl:webgl,

permissions:permission,

devtools:devtools,

automationScore:automationScore,

userAgent:navigator.userAgent

}};

}}



async function runChallenge(){{

try{{

const data=await collectFingerprint();

const res=await fetch("/api/challenge/verify",{{

method:"POST",

headers:{{"Content-Type":"application/json"}},

body:JSON.stringify(data)

}});

const result=await res.json();

if(result.status==="ok"){{

window.location.href="/r/{slug}";

}}else{{

document.body.innerHTML="<h3>Access Denied</h3>";

}}

}}catch(e){{

document.body.innerHTML="Verification failed";

}}

}}



setTimeout(runChallenge,800);

</script>

</body>
</html>
"""

    return HTMLResponse(content=html)


# ================= VERIFY CHALLENGE =================


@router.post("/api/challenge/verify")
async def verify_challenge(request: Request):

    data = await request.json()

    # ✅ FIXED IP (IMPORTANT)
    visitor = VisitorContext(request)
    ip = visitor.ip

    score = 0

    # webdriver detection
    if data.get("webdriver"):
        score += 50

    # automation detection
    if data.get("automationScore", 0) > 20:
        score += 40

    # devtools open
    if data.get("devtools"):
        score += 20

    # no plugins
    if data.get("plugins", 0) == 0:
        score += 10

    # missing languages
    if not data.get("languages"):
        score += 20

    # canvas error
    if data.get("canvas") == "error":
        score += 10

    # webgl missing
    if data.get("webgl") == "no_webgl":
        score += 10

    # timezone missing
    if not data.get("timezone"):
        score += 10

    # ================= BLOCK =================

    if score >= 80:
        return JSONResponse({"status": "blocked", "score": score})

    # ================= PASS =================

    # ================= PASS =================

    fp_string = f"{data.get('canvas')}-{data.get('webgl')}-{data.get('userAgent')}-{data.get('platform')}-{data.get('language')}"
    fp_hash = hashlib.sha256(fp_string.encode()).hexdigest()[:16]

    redis_client.set(f"fp:{ip}", fp_hash, ex=300)

    key = f"challenge_pass:{ip}"
    redis_client.set(key, 1, ex=300)

    return {"status": "ok"}
