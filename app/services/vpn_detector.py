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
    "nordvpn",
    "expressvpn",
    "surfshark",
    "mullvad",
    "protonvpn",
    "purevpn",
    "pia",
    "private internet",
    "ipvanish",
    "windscribe",
    "tunnelbear",
]

PROXY_KEYWORDS = [
    "proxy",
    "vpn",
    "hosting",
    "server",
    "cloud",
    "datacenter",
    "colo",
    "vps",
    "virtual",
    "instance",
]


# =========================================
# ASN DATACENTER (EXTENDED)
# =========================================

DATACENTER_ASN = {
    "AS16509",  # AWS
    "AS15169",  # Google
    "AS14061",  # DigitalOcean
    "AS16276",  # OVH
    "AS24940",  # Hetzner
    "AS8075",  # Microsoft
    "AS13335",  # Cloudflare
    "AS9009",  # M247
    "AS20473",  # Choopa / Vultr
    "AS63949",  # Linode
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
        if any(safe in org_norm for safe in SAFE_ISP):

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

        if result["confidence"] >= 85:
            result["is_vpn"] = True

        # residential proxy protection
        if result["is_proxy"] and not result["is_vpn"] and result["confidence"] < 80:
            result["is_residential_proxy"] = False

    except Exception:
        pass

    return result
