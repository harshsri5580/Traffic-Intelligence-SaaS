from urllib.parse import urljoin


def rewrite_all(html, slug, base_url):

    def wrap(url):
        return f"/r/{slug}?__ti_url__={url}"

    # 🔥 FIX RELATIVE LINKS
    html = html.replace('href="/', f'href="{wrap(base_url)}/')
    html = html.replace('src="/', f'src="{wrap(base_url)}/')

    # 🔥 ABSOLUTE LINKS
    html = html.replace(base_url, wrap(base_url))

    # 🔥 API CALLS (fetch / axios)
    html = html.replace('fetch("/', f'fetch("{wrap(base_url)}/')
    html = html.replace('axios.get("/', f'axios.get("{wrap(base_url)}/')

    # 🔥 BASE TAG (VERY IMPORTANT)
    html = html.replace("<head>", f'<head><base href="{wrap(base_url)}/">')

    return html
