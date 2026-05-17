from functools import lru_cache

FIREHOL_IPS = set()


@lru_cache(maxsize=1)
def load_firehol():

    global FIREHOL_IPS

    paths = [
        "app/firehol/firehol_level1.netset",
        "app/firehol/firehol_level2.netset",
    ]

    for path in paths:

        try:

            with open(path, "r", encoding="utf-8") as f:

                for line in f:

                    line = line.strip()

                    if not line or line.startswith("#") or ":" in line:
                        continue

                    FIREHOL_IPS.add(line)

        except Exception:
            pass


def is_firehol_flagged(ip: str) -> bool:

    try:

        if not FIREHOL_IPS:
            load_firehol()

        return ip in FIREHOL_IPS

    except Exception:
        return False
