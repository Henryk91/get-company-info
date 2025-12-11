from sqlalchemy import Column, Integer, String, DateTime, Text, Float, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)

class SearchQuery(Base):
    __tablename__ = "search_queries"
    
    id = Column(Integer, primary_key=True, index=True)
    city = Column(String, nullable=False, index=True)
    category = Column(String, nullable=False, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    places = relationship("Place", back_populates="search_query", cascade="all, delete-orphan")
    user = relationship("User")

class Place(Base):
    __tablename__ = "places"
    
    id = Column(Integer, primary_key=True, index=True)
    place_id = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    address = Column(String)
    city = Column(String)
    category = Column(String)
    latitude = Column(Float)
    longitude = Column(Float)
    rating = Column(Float)
    user_ratings_total = Column(Integer)
    phone_number = Column(String)
    website = Column(String)
    business_status = Column(String)
    types = Column(Text)  # JSON string of types
    formatted_address = Column(String)
    international_phone_number = Column(String)
    opening_hours = Column(Text)  # JSON string
    price_level = Column(Integer)
    description = Column(Text)  # Place description/review summary
    photo_reference = Column(String)  # Photo reference from Google Places
    photo_url = Column(String)  # Full photo URL
    email = Column(String)
    owner = Column(String)
    postal_code = Column(String)
    province = Column(String)
    suburb = Column(String)
    service_type = Column(String)
    has_details = Column(Boolean, default=False)  # Whether Place Details API was called
    search_query_id = Column(Integer, ForeignKey("search_queries.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    search_query = relationship("SearchQuery", back_populates="places")
