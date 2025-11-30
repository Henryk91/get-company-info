from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from ..database import get_db
from ..models import User, SearchQuery, Place
from ..schemas import (
    SearchRequest,
    SearchQueryResponse,
    PlaceResponse,
    RefreshRequest
)
from ..auth import get_current_active_user
from ..google_places import (
    search_places_by_category,
    get_place_details,
    format_place_data,
    format_place_details
)
import json

router = APIRouter(prefix="/api/places", tags=["places"])

@router.post("/search", response_model=SearchQueryResponse)
def search_places(
    search_request: SearchRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Search for places by city and category.
    Returns existing data if available, otherwise fetches from Google Places API.
    """
    city = search_request.city.lower().strip()
    category = search_request.category.lower().strip()
    
    # Check if search query already exists
    existing_query = db.query(SearchQuery).filter(
        SearchQuery.city == city,
        SearchQuery.category == category
    ).first()
    
    if existing_query:
        # Return existing data
        return existing_query
    
    # Create new search query
    search_query = SearchQuery(city=city, category=category)
    db.add(search_query)
    db.commit()
    db.refresh(search_query)
    
    # Fetch places from Google Places API
    try:
        places_data = search_places_by_category(city, category)
        
        for place_data in places_data:
            place_info = format_place_data(place_data, category, city)
            place = Place(**place_info, search_query_id=search_query.id)
            db.add(place)
        
        db.commit()
        db.refresh(search_query)
        
        # Optionally fetch place details (limited by max_details)
        if search_request.max_details and search_request.max_details > 0:
            fetch_place_details(db, search_query.id, search_request.max_details)
            db.refresh(search_query)
        
        return search_query
    
    except Exception as e:
        db.delete(search_query)
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching places: {str(e)}"
        )

@router.get("/queries", response_model=List[SearchQueryResponse])
def get_all_queries(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all search queries"""
    queries = db.query(SearchQuery).all()
    return queries

@router.get("/queries/{query_id}", response_model=SearchQueryResponse)
def get_query(
    query_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific search query with places"""
    query = db.query(SearchQuery).filter(SearchQuery.id == query_id).first()
    if not query:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Search query not found"
        )
    return query

@router.post("/refresh", response_model=SearchQueryResponse)
def refresh_places(
    refresh_request: RefreshRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Refresh places data by re-calling Google Places API
    """
    search_query = db.query(SearchQuery).filter(
        SearchQuery.id == refresh_request.search_query_id
    ).first()
    
    if not search_query:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Search query not found"
        )
    
    try:
        if refresh_request.refresh_text_search:
            # Delete existing places
            db.query(Place).filter(
                Place.search_query_id == search_query.id
            ).delete()
            
            # Fetch new places
            places_data = search_places_by_category(search_query.city, search_query.category)
            
            for place_data in places_data:
                place_info = format_place_data(place_data, search_query.category, search_query.city)
                place = Place(**place_info, search_query_id=search_query.id)
                db.add(place)
            
            db.commit()
        
        if refresh_request.refresh_details:
            max_details = refresh_request.max_details or len(search_query.places)
            fetch_place_details(db, search_query.id, max_details)
        
        db.refresh(search_query)
        return search_query
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error refreshing places: {str(e)}"
        )

@router.get("/queries/{query_id}/places", response_model=List[PlaceResponse])
def get_places(
    query_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all places for a search query"""
    search_query = db.query(SearchQuery).filter(SearchQuery.id == query_id).first()
    if not search_query:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Search query not found"
        )
    return search_query.places

def fetch_place_details(db: Session, search_query_id: int, max_details: int):
    """
    Fetch place details for places that don't have details yet
    """
    places = db.query(Place).filter(
        Place.search_query_id == search_query_id,
        Place.has_details == False
    ).limit(max_details).all()
    
    for place in places:
        try:
            details_data = get_place_details(place.place_id)
            if details_data.get("status") == "OK":
                details = format_place_details(details_data)
                # Update place with details
                for key, value in details.items():
                    if value is not None:
                        setattr(place, key, value)
                place.has_details = True
        except Exception as e:
            # Log error but continue with other places
            print(f"Error fetching details for place {place.place_id}: {str(e)}")
            continue
    
    db.commit()

