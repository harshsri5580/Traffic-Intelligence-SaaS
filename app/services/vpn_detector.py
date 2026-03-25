import ipaddress


# =========================================
# KNOWN TOR EXIT NODE SAMPLE
# (real system me external feed use hota hai)
# =========================================

TOR_EXIT_NODES = {
    "185.220.101.1",
    "185.220.101.2",
    "185.220.102.1",
}


# =========================================
# KNOWN VPN PROVIDER KEYWORDS
# =========================================

VPN_KEYWORDS = [
    "nordvpn",
    "expressvpn",
    "surfshark",
    "mullvad",
    "protonvpn",
    "purevpn",
    "private internet access",
]


# =========================================
# KNOWN PROXY / HOSTING KEYWORDS
# =========================================

PROXY_KEYWORDS = [
    "proxy",
    "vpn",
    "hosting",
    "server",
    "cloud",
    "datacenter",
]


# =========================================
# ASN DATACENTER LIST (COMMON)
# =========================================

DATACENTER_ASN = {
    "AS16509",  # AWS
    "AS15169",  # Google
    "AS14061",  # DigitalOcean
    "AS16276",  # OVH
    "AS24940",  # Hetzner
    "AS8075",  # Microsoft
    "AS13335",  # Cloudflare
}


# =========================================
# MAIN VPN DETECTION
# =========================================


def detect_vpn(ip, org=None, asn=None):

    result = {
        "is_vpn": False,
        "is_proxy": False,
        "is_tor": False,
        "is_residential_proxy": False,
    }

    try:

        # ----------------------
        # TOR EXIT NODE
        # ----------------------

        if ip in TOR_EXIT_NODES:
            result["is_tor"] = True
            result["is_proxy"] = True

        # ----------------------
        # IP VALIDATION
        # ----------------------

        ip_obj = ipaddress.ip_address(ip)

        # Private IPs skip
        if ip_obj.is_private:
            return result

        # ----------------------
        # DATACENTER ASN CHECK
        # ----------------------

        if asn and asn in DATACENTER_ASN:

            result["is_proxy"] = True

        # ----------------------
        # ORG / ISP KEYWORD CHECK
        # ----------------------

        if org:

            org_lower = org.lower()

            for keyword in VPN_KEYWORDS:

                if keyword in org_lower:

                    result["is_vpn"] = True
                    result["is_proxy"] = True
                    break

            for keyword in PROXY_KEYWORDS:

                if keyword in org_lower:

                    result["is_proxy"] = True
                    break

        # ----------------------
        # HEURISTIC CHECK
        # ----------------------

        ip_str = str(ip)

        # suspicious IP ranges example
        if ip_str.startswith("45.") or ip_str.startswith("104."):
            result["is_proxy"] = True

        # residential proxy heuristic
        if ip_str.endswith(".1") or ip_str.endswith(".254"):
            result["is_residential_proxy"] = True

    except Exception:
        pass

    return result
