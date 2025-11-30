from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# User schemas
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Auth schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Place schemas
class PlaceBase(BaseModel):
    place_id: str
    name: str
    address: Optional[str] = None
    city: Optional[str] = None
    category: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    rating: Optional[float] = None
    user_ratings_total: Optional[int] = None
    phone_number: Optional[str] = None
    website: Optional[str] = None
    business_status: Optional[str] = None
    types: Optional[str] = None
    formatted_address: Optional[str] = None
    international_phone_number: Optional[str] = None
    opening_hours: Optional[str] = None
    price_level: Optional[int] = None
    has_details: bool = False

class PlaceCreate(PlaceBase):
    search_query_id: int

class PlaceResponse(PlaceBase):
    id: int
    search_query_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# Search Query schemas
class SearchQueryCreate(BaseModel):
    city: str
    category: str

class SearchQueryResponse(BaseModel):
    id: int
    city: str
    category: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    places: List[PlaceResponse] = []
    
    class Config:
        from_attributes = True

# Search request
class SearchRequest(BaseModel):
    city: str
    category: str
    max_details: Optional[int] = None  # Limit Place Details API calls

# Refresh request
class RefreshRequest(BaseModel):
    search_query_id: int
    refresh_text_search: bool = False
    refresh_details: bool = False
    max_details: Optional[int] = None

