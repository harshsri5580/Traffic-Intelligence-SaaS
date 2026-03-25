import os
from dotenv import load_dotenv

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
DATABASE_URL = os.getenv("DATABASE_URL")

ENABLE_CHALLENGE = os.getenv("ENABLE_CHALLENGE", "false").lower() == "true"
BASE_URL = os.getenv("BASE_URL", "http://127.0.0.1:8000")
