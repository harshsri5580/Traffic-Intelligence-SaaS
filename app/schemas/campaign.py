from pydantic import BaseModel, HttpUrl
from typing import List, Optional


class CampaignCreate(BaseModel):

    name: str
    slug: Optional[str] = None

    fallback_url: Optional[HttpUrl] = None
    safe_page_url: Optional[HttpUrl] = None
    bot_url: Optional[HttpUrl] = None


class CampaignResponse(BaseModel):

    id: int
    name: str
    slug: str

    fallback_url: Optional[str] = None
    safe_page_url: Optional[str] = None
    bot_url: Optional[str] = None

    class Config:
        from_attributes = True
