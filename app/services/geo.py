import geoip2.database
import os
import json

from services.redis_client import redis_client

BASE_DIR = os.path.dirname(__file__)

CITY_DB_PATH = os.path.join(BASE_DIR, "GeoLite2-City.mmdb")
ASN_DB_PATH = os.path.join(BASE_DIR, "GeoLite2-ASN.mmdb")

city_reader = None
asn_reader = None

# =====================================
# SAFE DATABASE LOADING
# =====================================

try:
    city_reader = geoip2.database.Reader(CITY_DB_PATH)
except Exception:
    city_reader = None

try:
    asn_reader = geoip2.database.Reader(ASN_DB_PATH)
except Exception:
    asn_reader = None


# =====================================
# DATACENTER KEYWORDS
# =====================================

DATACENTER_KEYWORDS = [
    "amazon",
    "aws",
    "google",
    "digitalocean",
    "linode",
    "ovh",
    "hetzner",
    "vultr",
    "microsoft",
    "oracle",
    "cloudflare",
    "scaleway",
]


# =====================================
# GEO DATA
# =====================================


def get_geo_data(ip_address: str):

    cache_key = f"geo:{ip_address}"

    cached = redis_client.get(cache_key)

    if cached:
        return json.loads(cached)

    if not city_reader:
        return None

    try:

        response = city_reader.city(ip_address)

        data = {
            "country": response.country.name,
            "country_code": response.country.iso_code,
            "region": response.subdivisions.most_specific.name,
            "city": response.city.name,
            "timezone": response.location.time_zone,
            "latitude": response.location.latitude,
            "longitude": response.location.longitude,
        }

        redis_client.setex(cache_key, 86400, json.dumps(data))

        return data

    except Exception:

        data = {
            "country": None,
            "country_code": None,
            "region": None,
            "city": None,
            "timezone": None,
            "latitude": None,
            "longitude": None,
        }

        redis_client.setex(cache_key, 86400, json.dumps(data))

        return data


# =====================================
# ASN / NETWORK DATA
# =====================================


def get_asn_data(ip_address: str):

    cache_key = f"asn:{ip_address}"

    cached = redis_client.get(cache_key)

    if cached:
        return json.loads(cached)

    if not asn_reader:
        return None

    try:

        response = asn_reader.asn(ip_address)

        asn_number = response.autonomous_system_number
        org = response.autonomous_system_organization

        connection_type = "residential"

        if org:

            org_lower = org.lower()

            for keyword in DATACENTER_KEYWORDS:

                if keyword in org_lower:
                    connection_type = "datacenter"
                    break

        data = {
            "asn": asn_number,
            "org": org,
            "isp": org,
            "connection_type": connection_type,
        }

        redis_client.setex(cache_key, 86400, json.dumps(data))

        return data

    except Exception:

        data = {
            "asn": None,
            "org": None,
            "isp": None,
            "connection_type": None,
        }

        redis_client.setex(cache_key, 86400, json.dumps(data))

        return data
