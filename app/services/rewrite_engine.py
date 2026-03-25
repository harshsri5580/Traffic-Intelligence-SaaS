from bs4 import BeautifulSoup
from urllib.parse import urljoin, quote


class RewriteEngine:

    def __init__(self, base_url: str, slug: str, ip: str, user_agent: str):

        self.base_url = (base_url or "").rstrip("/")
        self.slug = slug
        self.ip = ip
        self.user_agent = user_agent

    # ---------------- SKIP RULES ----------------

    def _should_skip(self, url: str) -> bool:

        if not url:
            return True

        url = url.strip()

        if url.startswith("#"):
            return True

        if url.startswith("javascript:"):
            return True

        if url.startswith("mailto:"):
            return True

        if url.startswith("tel:"):
            return True

        if url.startswith("data:"):
            return True

        # already proxied
        if url.startswith(f"/r/{self.slug}"):
            return True

        # internal APIs
        if url.startswith("/api/"):
            return True

        return False

    # ---------------- URL REWRITE ----------------

    def _rewrite_url(self, url: str) -> str:

        if self._should_skip(url):
            return url

        try:

            absolute_url = urljoin(self.base_url, url)

            encoded_url = quote(absolute_url, safe="")

            return f"/r/{self.slug}?__ti_url__={encoded_url}"

        except Exception:

            return url

    # ---------------- HTML REWRITE ----------------

    def rewrite_html(self, html_content: str) -> str:

        try:

            soup = BeautifulSoup(html_content, "html.parser")

        except Exception:

            return html_content

        # ---------------- BASE TAG ----------------

        try:

            base_tag = soup.find("base", href=True)

            if base_tag:
                self.base_url = urljoin(self.base_url, base_tag["href"])

        except Exception:
            pass

        # ---------------- ANCHOR LINKS ----------------

        for tag in soup.find_all("a", href=True):

            try:
                tag["href"] = self._rewrite_url(tag["href"])
            except Exception:
                pass

        # ---------------- FORMS ----------------

        for tag in soup.find_all("form", action=True):

            try:
                tag["action"] = self._rewrite_url(tag["action"])
            except Exception:
                pass

        # ---------------- SCRIPTS ----------------

        for tag in soup.find_all("script", src=True):

            try:
                tag["src"] = self._rewrite_url(tag["src"])
            except Exception:
                pass

        # ---------------- IMAGES ----------------

        for tag in soup.find_all("img", src=True):

            try:
                tag["src"] = self._rewrite_url(tag["src"])
            except Exception:
                pass

        # ---------------- IFRAME ----------------

        for tag in soup.find_all("iframe", src=True):

            try:
                tag["src"] = self._rewrite_url(tag["src"])
            except Exception:
                pass

        # ---------------- VIDEO / SOURCE ----------------

        for tag in soup.find_all(["video", "source"], src=True):

            try:
                tag["src"] = self._rewrite_url(tag["src"])
            except Exception:
                pass

        # ---------------- CSS ----------------

        for tag in soup.find_all("link", href=True):

            try:
                tag["href"] = self._rewrite_url(tag["href"])
            except Exception:
                pass

        # ---------------- META REFRESH ----------------

        for tag in soup.find_all(
            "meta",
            attrs={"http-equiv": lambda x: x and x.lower() == "refresh"},
        ):

            try:

                content = tag.get("content", "")

                if "url=" in content.lower():

                    parts = content.split("url=")

                    if len(parts) == 2:

                        new_url = self._rewrite_url(parts[1].strip())

                        tag["content"] = f"{parts[0]}url={new_url}"

            except Exception:
                pass

        # ---------------- JS NAVIGATION INTERCEPTOR ----------------

        interceptor_script = """
<script>
(function(){

const SLUG="__SLUG__";

async function secureNavigate(url){

if(!url||typeof url!=="string") return url;

if(url.startsWith("/r/")) return url;
if(url.startsWith("#")) return url;
if(url.startsWith("javascript:")) return url;
if(url.startsWith("mailto:")) return url;
if(url.startsWith("tel:")) return url;
if(url.startsWith("data:")) return url;

try{

let absolute=new URL(url,window.location.href).href;

const res=await fetch("/api/generate-token",{
method:"POST",
headers:{"Content-Type":"application/json"},
body:JSON.stringify({url:absolute})
});

const data=await res.json();

return "/r/"+SLUG+"/"+data.token;

}catch(e){
return url;
}

}

const originalAssign=window.location.assign;
window.location.assign=async function(url){
url=await secureNavigate(url);
return originalAssign.call(this,url);
};

const originalReplace=window.location.replace;
window.location.replace=async function(url){
url=await secureNavigate(url);
return originalReplace.call(this,url);
};

const originalOpen=window.open;
window.open=async function(url,name,specs){
if(url) url=await secureNavigate(url);
return originalOpen.call(this,url,name,specs);
};

})();
</script>
"""

        interceptor_script = interceptor_script.replace("__SLUG__", self.slug)

        # ---------------- BEHAVIOR TRACKING ----------------

        behavior_script = """
<script>

let ti_mouse_moves=0;
let ti_scrolls=0;
let ti_clicks=0;

document.addEventListener("mousemove",()=>ti_mouse_moves++);
document.addEventListener("scroll",()=>ti_scrolls++);
document.addEventListener("click",()=>ti_clicks++);

setInterval(()=>{

fetch("/api/behavior",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify({
mouse_moves:ti_mouse_moves,
scrolls:ti_scrolls,
clicks:ti_clicks
})
}).catch(()=>{});

},5000);

</script>

<script>

function collectFingerprint(){

const fp = {
screen: screen.width + "x" + screen.height,
timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
platform: navigator.platform,
language: navigator.language,
hardware: navigator.hardwareConcurrency || 0,
touch: navigator.maxTouchPoints || 0
};

fetch("/api/fingerprint",{
method:"POST",
headers:{
"Content-Type":"application/json"
},
body:JSON.stringify(fp)
}).catch(()=>{});

}

collectFingerprint();

</script>
"""

        # ---------------- INJECT SCRIPTS ----------------

        try:

            if soup.body:

                soup.body.insert(0, BeautifulSoup(interceptor_script, "html.parser"))

                soup.body.insert(1, BeautifulSoup(behavior_script, "html.parser"))

        except Exception:
            pass

        return str(soup)
