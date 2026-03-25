from pydantic import BaseModel


class OfferCreate(BaseModel):
    campaign_id: int
    url: str
    weight: int = 1
