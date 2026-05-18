import ipaddress
import re

# =========================================
# TOR EXIT NODES (extendable)
# =========================================

TOR_EXIT_NODES = {
    "185.220.101.1",
    "185.220.101.2",
    "185.220.102.1",
}


# =========================================
# VPN / PROXY KEYWORDS (CLEAN + STRONG)
# =========================================

VPN_KEYWORDS = [
    # MAJOR VPN
    "nordvpn",
    "expressvpn",
    "surfshark",
    "mullvad",
    "protonvpn",
    "purevpn",
    "ipvanish",
    "windscribe",
    "tunnelbear",
    "hide.me",
    "hidemyass",
    "hma vpn",
    "cyberghost",
    "vyprvpn",
    "private internet access",
    "pia vpn",
    "atlasvpn",
    "urbanvpn",
    "hola vpn",
    "adguard vpn",
    "fastestvpn",
    "ivacy",
    "vpn unlimited",
    "openvpn",
    "wireguard",
    # ENTERPRISE VPN
    "fortinet",
    "fortigate",
    "forticlient",
    "cisco anyconnect",
    "openconnect",
    "globalprotect",
    "pulse secure",
    # GENERIC
    "vpn",
    "secure tunnel",
    "encrypted tunnel",
]

PROXY_KEYWORDS = [
    # GENERIC
    "proxy",
    "anonymous proxy",
    "elite proxy",
    "transparent proxy",
    "forward proxy",
    "reverse proxy",
    "vpn",
    "hosting",
    "server",
    "cloud",
    "datacenter",
    "colo",
    "vps",
    "virtual",
    "instance",
    # MAJOR HOSTING / VPS
    "aws",
    "amazon",
    "google cloud",
    "azure",
    "oracle cloud",
    "digitalocean",
    "linode",
    "ovh",
    "hetzner",
    "vultr",
    "choopa",
    "m247",
    "contabo",
    "leaseweb",
    "psychz",
    "quadranet",
    "colocrossing",
    "hostroyale",
    "cyber folks",
    "digi",
    "xtom",
    "aeza",
    "pq hosting",
    "ipxo",
    "timeweb",
    "gthost",
    "hosthatch",
    "smartape",
    "fozzy",
    "bluevps",
    "racknerd",
    "buyvm",
    "frantech",
    "zenlayer",
    "scaleway",
    # RESIDENTIAL PROXY NETWORKS
    "brightdata",
    "bright data",
    "luminati",
    "oxylabs",
    "smartproxy",
    "soax",
    "netnut",
    "packetstream",
    "honeygain",
    "geosurf",
    "proxyrack",
    # REVIEWER / FILTER ABUSE
    "scraper",
    "crawler",
    "automation",
    "headless",
    "selenium",
    "playwright",
    "puppeteer",
]


# =========================================
# ASN DATACENTER (EXTENDED)
# =========================================
DATACENTER_ASN = {
    # =========================
    # MAJOR CLOUD
    # =========================
    "AS16509",  # AWS
    "AS14618",  # Amazon
    "AS15169",  # Google
    "AS396982",  # Google Cloud
    "AS8075",  # Microsoft Azure
    "AS8068",  # Microsoft
    "AS31898",  # Oracle Cloud
    "AS45102",  # Alibaba Cloud
    "AS63949",  # Linode / Akamai
    "AS20940",  # Akamai
    "AS16625",  # Akamai
    "AS13335",  # Cloudflare
    # =========================
    # VPS / HOSTING
    # =========================
    "AS14061",  # DigitalOcean
    "AS16276",  # OVH
    "AS24940",  # Hetzner
    "AS20473",  # Choopa / Vultr
    "AS9009",  # M247
    "AS51167",  # Contabo
    "AS197540",  # netcup
    "AS12876",  # Online.net / Scaleway
    "AS12874",  # Fastweb hosting
    "AS63949",  # Linode
    "AS200019",  # Alexhost
    "AS60068",  # CDN77 / DataCamp
    "AS40676",  # Psychz
    "AS8100",  # QuadraNet
    "AS30633",  # Leaseweb USA
    "AS60781",  # Leaseweb NL
    "AS59253",  # Leaseweb APAC
    "AS36352",  # ColoCrossing
    "AS29802",  # Hivelocity
    "AS46475",  # Limestone
    "AS23470",  # ReliableSite
    "AS55293",  # A2 Hosting
    "AS54600",  # BigScoots
    "AS63023",  # GTHost
    "AS63018",  # Hydra
    "AS395954",  # HostHatch
    "AS202425",  # IP Volume
    "AS8108",  # 1&1 / IONOS
    "AS8560",  # IONOS
    "AS49505",  # Selectel
    "AS197695",  # REG.RU
    "AS9123",  # Timeweb
    "AS21100",  # ITL LLC
    "AS47890",  # Unmanaged LTD
    "AS44477",  # STARK Industries
    "AS215540",  # PQ Hosting
    "AS207713",  # Aeza
    "AS206092",  # XTom
    "AS40065",  # CNSERVERS
    "AS21859",  # Zenlayer
    "AS13213",  # UK2 / VPS
    "AS47583",  # Hostinger VPS
    "AS47589",  # Hostinger
    "AS47598",  # Digital Energy
    "AS199524",  # GCore
    "AS201106",  # BlueVPS
    "AS57976",  # BlazingFast
    "AS62240",  # Clouvider
    "AS58061",  # Scalaxy
    "AS61317",  # SmartApe
    "AS52000",  # MIRholding
    "AS51395",  # RouteLabel
    "AS211252",  # DataForest
    "AS50340",  # Selectel SPB
    # =========================
    # VPN / PROXY / REVIEWER
    # =========================
    "AS60064",  # CDN77 VPN infra
    "AS398101",  # NordVPN infra
    "AS210644",  # Surfshark
    "AS136787",  # ProtonVPN infra
    "AS9002",  # RETN
    "AS9008",  # M247 Proxy infra
    "AS206264",  # FineProxy
    "AS210083",  # Proxy6
    "AS200651",  # DataCamp proxy infra
    "AS213230",  # Proxy reseller infra
    "AS205016",  # Proxy network infra
    "AS212238",  # Proxy hosting
    "AS208046",  # VPN backbone
    "AS202425",  # IPXO
    "AS210558",  # ProxyLine
    "AS44477",  # STARK proxy infra
    "AS49453",  # UpCloud
    "AS51167",  # Contabo
    "AS58057",  # SecureHost
    "AS204601",  # VPN infra
    "AS59692",  # IQWeb
    "AS61317",  # SmartApe
    "AS198953",  # HostRoyale
    "AS215292",  # DIGI VPS
    # =========================
    # MOBILE / CGNAT ABUSE
    # (DO NOT HARD BLOCK)
    # =========================
    # keep for scoring only
    "AS21928",  # T-Mobile
    "AS22394",  # Verizon Wireless
}


# =========================================
# SAFE ISP (FALSE POSITIVE PROTECTION)
# =========================================

SAFE_ISP = [
    "jio",
    "airtel",
    "vodafone",
    "vi india",
    "bsnl",
    "comcast",
    "verizon",
    "att",
    "t-mobile",
    "tmobile",
    "reliance",
    "spectrum",
    "cox",
    "charter",
    "orange",
    "telefonica",
    "telstra",
    "rogers",
    "bell canada",
    "shaw",
    "vodafone india",
]


# =========================================
# NORMALIZER
# =========================================


def normalize(text):
    if not text:
        return ""
    return re.sub(r"[^\w\s]", "", text.lower())


# =========================================
# MAIN DETECTION
# =========================================


def detect_vpn(ip, org=None, asn=None):

    result = {
        "is_vpn": False,
        "is_proxy": False,
        "is_tor": False,
        "is_residential_proxy": False,
        "confidence": 0,  # 🔥 NEW
    }

    try:

        ip_obj = ipaddress.ip_address(ip)

        # ----------------------
        # PRIVATE / LOCAL SAFE
        # ----------------------
        if ip_obj.is_private or ip_obj.is_loopback:
            return result

        ip_str = str(ip)

        org_norm = normalize(org)
        asn_str = str(asn or "").upper()

        # ----------------------
        # TOR CHECK
        # ----------------------
        if ip_str in TOR_EXIT_NODES:
            result["is_tor"] = True
            result["is_proxy"] = True
            result["confidence"] += 80

        # ----------------------
        # ASN CHECK (STRONG SIGNAL)
        # ----------------------
        if asn_str in DATACENTER_ASN:

            result["is_proxy"] = True
            result["confidence"] += 70

            # strong cloud providers
            if asn_str in ["AS16509", "AS15169", "AS8075"]:
                result["confidence"] += 10

        # ----------------------
        # ISP SAFE OVERRIDE
        # ----------------------
        if any(safe in org_norm for safe in SAFE_ISP) and asn_str not in DATACENTER_ASN:

            # only trust if NOT already strong proxy/datacenter signal
            if result["confidence"] < 60:
                result["confidence"] = 0
                result["is_proxy"] = False
                result["is_vpn"] = False
                result["is_residential_proxy"] = False

                return result

        # ----------------------
        # VPN KEYWORD MATCH
        # ----------------------
        for keyword in VPN_KEYWORDS:
            if keyword in org_norm:
                result["is_vpn"] = True
                result["is_proxy"] = True
                result["confidence"] += 60
                break

        # ----------------------
        # PROXY / HOSTING MATCH
        # ----------------------
        for keyword in PROXY_KEYWORDS:
            if keyword in org_norm:
                result["is_proxy"] = True
                result["confidence"] += 30
                break

        # ----------------------
        # IP HEURISTICS (SMART)
        # ----------------------

        # cloud ranges (common)
        # if ip_str.startswith(("45.", "104.", "172.", "192.168")):
        #     result["is_proxy"] = True
        #     result["confidence"] += 15

        # suspicious pattern
        # if ip_str.endswith(".1") or ip_str.endswith(".254"):
        #     result["is_residential_proxy"] = True
        #     result["confidence"] += 20

        # ----------------------
        # FINAL DECISION LOGIC
        # ----------------------

        if result["confidence"] >= 60:
            result["is_proxy"] = True

        if result["confidence"] >= 88:
            result["is_vpn"] = True

        # residential proxy protection
        if result["is_proxy"] and not result["is_vpn"] and result["confidence"] < 80:
            result["is_residential_proxy"] = False

    except Exception:
        pass

    return result
