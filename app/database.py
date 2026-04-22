from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import DATABASE_URL

# 🔥 PRODUCTION READY ENGINE
engine = create_engine(
    DATABASE_URL,
    pool_size=20,  # ✅ default 5 → 20
    max_overflow=30,  # ✅ extra burst traffic handle
    pool_timeout=30,  # ⏱ wait time
    pool_recycle=1800,  # 🔄 avoid stale connections
    pool_pre_ping=True,  # 🔥 dead connection auto fix
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


# 🔥 SAFE DB DEPENDENCY (already correct but keep)
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()  # 🔥 VERY IMPORTANT
