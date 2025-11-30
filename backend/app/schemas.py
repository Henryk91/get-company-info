from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime

# User schemas
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    
    @field_validator('password')
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not v:
            raise ValueError('Password cannot be empty')
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        # Bcrypt has a 72-byte limit. We'll use 72 characters as a safe limit
        # (assuming ASCII/UTF-8 single-byte characters)
        if len(v.encode('utf-8')) > 72:
            raise ValueError('Password cannot be longer than 72 characters')
        return v
    
    @field_validator('username')
    @classmethod
    def validate_username(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError('Username cannot be empty')
        if len(v) < 3:
            raise ValueError('Username must be at least 3 characters long')
        if len(v) > 50:
            raise ValueError('Username cannot be longer than 50 characters')
        return v.strip()

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
    description: Optional[str] = None
    photo_reference: Optional[str] = None
    photo_url: Optional[str] = None
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

