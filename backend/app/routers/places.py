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
    format_place_details,
    is_google_access_allowed
)
from ..logging_config import get_logger
import json

logger = get_logger(__name__)

router = APIRouter(prefix="/api/places", tags=["places"])

def _ensure_google_access(current_user: User):
    if not is_google_access_allowed(current_user.email):
        logger.warning(f"User {current_user.email} attempted Google API access but is not allowlisted")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Google API access is restricted for this account"
        )

def _upsert_place(db: Session, place_info: dict, search_query_id: int) -> Place:
    """
    Insert or update a place by place_id.
    Preserves existing detail fields if we are overwriting with a text-search payload
    that lacks detailed data.
    """
    place_id = place_info.get("place_id")
    existing = db.query(Place).filter(Place.place_id == place_id).first()
    if existing:
        for key, value in place_info.items():
            if value is not None:
                setattr(existing, key, value)
        existing.search_query_id = search_query_id
        # If details were already fetched, keep them
        if existing.has_details:
            existing.has_details = True
        db.add(existing)
        return existing
    place = Place(**place_info, search_query_id=search_query_id)
    db.add(place)
    return place

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
    
    logger.info(f"Search request from user {current_user.username} (ID: {current_user.id}): city='{city}', category='{category}', max_details={search_request.max_details}")
    
    # Check if search query already exists for this user
    existing_query = db.query(SearchQuery).filter(
        SearchQuery.city == city,
        SearchQuery.category == category,
        SearchQuery.user_id == current_user.id
    ).first()
    
    if existing_query:
        logger.info(f"Returning cached search query (ID: {existing_query.id}) with {len(existing_query.places)} places")
        return existing_query
    
    _ensure_google_access(current_user)
    
    # Create new search query
    logger.info(f"Creating new search query for city='{city}', category='{category}' for user {current_user.username}")
    search_query = SearchQuery(city=city, category=category, user_id=current_user.id)
    db.add(search_query)
    db.commit()
    db.refresh(search_query)
    
    # Fetch places from Google Places API
    try:
        logger.info(f"Fetching places from Google Places API for city='{city}', category='{category}'")
        places_data = search_places_by_category(city, category)
        logger.info(f"Received {len(places_data)} places from Google Places API")
        
        for place_data in places_data:
            place_info = format_place_data(place_data, category, city)
            _upsert_place(db, place_info, search_query.id)
        
        db.commit()
        db.refresh(search_query)
        logger.info(f"Saved {len(search_query.places)} places to database (SearchQuery ID: {search_query.id})")
        
        # Optionally fetch place details (limited by max_details)
        if search_request.max_details and search_request.max_details > 0:
            logger.info(f"Fetching place details for up to {search_request.max_details} places (limited by max_details parameter)")
            fetch_place_details(db, search_query.id, search_request.max_details)
            db.refresh(search_query)
            logger.info(f"Place details fetch completed for search query ID {search_query.id}")
        else:
            logger.info(f"max_details not provided or set to 0, skipping place details fetch")
        
        return search_query
    
    except Exception as e:
        logger.error(f"Error fetching places for city='{city}', category='{category}': {str(e)}", exc_info=True)
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
    """Get all search queries for the current user"""
    logger.debug(f"User {current_user.username} requested all search queries")
    queries = db.query(SearchQuery).filter(SearchQuery.user_id == current_user.id).all()
    logger.info(f"Returning {len(queries)} search queries for user {current_user.username}")
    return queries

@router.get("/queries/{query_id}", response_model=SearchQueryResponse)
def get_query(
    query_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get a specific search query with places (only if it belongs to the current user)"""
    logger.debug(f"User {current_user.username} requested search query ID: {query_id}")
    query = db.query(SearchQuery).filter(
        SearchQuery.id == query_id,
        SearchQuery.user_id == current_user.id
    ).first()
    if not query:
        logger.warning(f"Search query ID {query_id} not found or doesn't belong to user {current_user.username}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Search query not found"
        )
    logger.info(f"Returning search query ID {query_id} with {len(query.places)} places")
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
    logger.info(
        f"Refresh request from user {current_user.username} for search query ID {refresh_request.search_query_id}: "
        f"refresh_text_search={refresh_request.refresh_text_search}, "
        f"refresh_details={refresh_request.refresh_details}, "
        f"max_details={refresh_request.max_details}"
    )
    
    search_query = db.query(SearchQuery).filter(
        SearchQuery.id == refresh_request.search_query_id,
        SearchQuery.user_id == current_user.id
    ).first()
    
    if not search_query:
        logger.warning(f"Search query ID {refresh_request.search_query_id} not found or doesn't belong to user {current_user.username}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Search query not found"
        )
    
    try:
        if refresh_request.refresh_text_search or refresh_request.refresh_details:
            _ensure_google_access(current_user)
        
        if refresh_request.refresh_text_search:
            logger.info(f"Refreshing text search for query ID {search_query.id} (city='{search_query.city}', category='{search_query.category}')")
            # Delete existing places
            deleted_count = db.query(Place).filter(
                Place.search_query_id == search_query.id
            ).count()
            db.query(Place).filter(
                Place.search_query_id == search_query.id
            ).delete()
            logger.info(f"Deleted {deleted_count} existing places")
            
            # Fetch new places
            places_data = search_places_by_category(search_query.city, search_query.category)
            logger.info(f"Fetched {len(places_data)} places from Google Places API")
            
            for place_data in places_data:
                place_info = format_place_data(place_data, search_query.category, search_query.city)
                _upsert_place(db, place_info, search_query.id)
            
            db.commit()
            logger.info(f"Saved {len(places_data)} new places to database")
        
        if refresh_request.refresh_details:
            # Use max_details if provided, otherwise fetch details for all places without details
            if refresh_request.max_details and refresh_request.max_details > 0:
                max_details = refresh_request.max_details
            else:
                # Count places without details
                places_without_details = db.query(Place).filter(
                    Place.search_query_id == search_query.id,
                    Place.has_details == False
                ).count()
                max_details = places_without_details
            logger.info(f"Refreshing place details for up to {max_details} places")
            fetch_place_details(db, search_query.id, max_details)
        
        db.refresh(search_query)
        logger.info(f"Refresh completed for search query ID {search_query.id}")
        return search_query
    
    except Exception as e:
        logger.error(f"Error refreshing places for query ID {refresh_request.search_query_id}: {str(e)}", exc_info=True)
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
    """Get all places for a search query (only if it belongs to the current user)"""
    logger.debug(f"User {current_user.username} requested places for query ID: {query_id}")
    search_query = db.query(SearchQuery).filter(
        SearchQuery.id == query_id,
        SearchQuery.user_id == current_user.id
    ).first()
    if not search_query:
        logger.warning(f"Search query ID {query_id} not found or doesn't belong to user {current_user.username}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Search query not found"
        )
    logger.info(f"Returning {len(search_query.places)} places for query ID {query_id}")
    return search_query.places

def fetch_place_details(db: Session, search_query_id: int, max_details: int):
    """
    Fetch place details for places that don't have details yet
    Limited by max_details parameter to control API usage
    """
    # Count total places without details
    total_without_details = db.query(Place).filter(
        Place.search_query_id == search_query_id,
        Place.has_details == False
    ).count()
    
    # Fetch only up to max_details places
    places = db.query(Place).filter(
        Place.search_query_id == search_query_id,
        Place.has_details == False
    ).limit(max_details).all()
    
    logger.info(f"Fetching details for {len(places)} places (max_details={max_details}, total without details={total_without_details}, query ID: {search_query_id})")
    success_count = 0
    error_count = 0
    
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
                success_count += 1
                logger.debug(f"Successfully fetched details for place: {place.name} (ID: {place.place_id})")
            else:
                logger.warning(f"Google Places API returned status '{details_data.get('status')}' for place ID: {place.place_id}")
                error_count += 1
        except Exception as e:
            error_count += 1
            logger.error(f"Error fetching details for place {place.place_id} ({place.name}): {str(e)}", exc_info=True)
            continue
    
    db.commit()
    logger.info(f"Place details fetch completed: {success_count} successful, {error_count} errors")
