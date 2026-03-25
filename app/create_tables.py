from .database import engine, Base
from .models import Campaign, Offer, ClickLog, BlockedIP, User

Base.metadata.create_all(bind=engine)

print("Tables created successfully ✅")