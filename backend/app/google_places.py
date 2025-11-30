import requests
import json
from typing import List, Dict, Optional
import os
from dotenv import load_dotenv
from .logging_config import get_logger

load_dotenv()

logger = get_logger(__name__)

GOOGLE_PLACES_API_KEY = os.getenv("GOOGLE_PLACES_API_KEY")
GOOGLE_PLACES_API_BASE_URL = "https://maps.googleapis.com/maps/api/place"

if not GOOGLE_PLACES_API_KEY:
    logger.error("GOOGLE_PLACES_API_KEY not set in environment variables")
    raise ValueError("GOOGLE_PLACES_API_KEY must be set in environment variables")

logger.info("Google Places API module initialized")

def text_search(query: str, location: Optional[str] = None) -> Dict:
    """
    Perform Google Places Text Search
    """
    url = f"{GOOGLE_PLACES_API_BASE_URL}/textsearch/json"
    params = {
        "query": query,
        "key": GOOGLE_PLACES_API_KEY
    }
    
    if location:
        params["location"] = location
    
    logger.info(f"Calling Google Places Text Search API: query='{query}', location={location}")
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        status = data.get("status", "UNKNOWN")
        results_count = len(data.get("results", []))
        logger.info(f"Google Places Text Search API response: status='{status}', results={results_count}")
        
        if status != "OK":
            logger.warning(f"Google Places API returned non-OK status: {status}")
        
        return data
    except requests.exceptions.RequestException as e:
        logger.error(f"Error calling Google Places Text Search API: {str(e)}", exc_info=True)
        raise

def get_place_details(place_id: str) -> Dict:
    """
    Get detailed information about a place using Place Details API
    """
    url = f"{GOOGLE_PLACES_API_BASE_URL}/details/json"
    params = {
        "place_id": place_id,
        "fields": "name,formatted_address,geometry,rating,user_ratings_total,formatted_phone_number,international_phone_number,website,business_status,types,opening_hours,price_level",
        "key": GOOGLE_PLACES_API_KEY
    }
    
    logger.debug(f"Calling Google Places Details API for place_id: {place_id}")
    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json()
        status = data.get("status", "UNKNOWN")
        logger.debug(f"Google Places Details API response for place_id {place_id}: status='{status}'")
        
        if status != "OK":
            logger.warning(f"Google Places Details API returned non-OK status for place_id {place_id}: {status}")
        
        return data
    except requests.exceptions.RequestException as e:
        logger.error(f"Error calling Google Places Details API for place_id {place_id}: {str(e)}", exc_info=True)
        raise

def search_places_by_category(city: str, category: str) -> List[Dict]:
    """
    Search for places in a city by category
    Returns list of place results
    """
    query = f"{category} in {city}"
    logger.info(f"Searching places by category: city='{city}', category='{category}', query='{query}'")
    results = []
    next_page_token = None
    
    # Get first page
    data = text_search(query)
    if data.get("status") == "OK":
        results.extend(data.get("results", []))
        next_page_token = data.get("next_page_token")
        logger.info(f"Retrieved {len(results)} places from first page")
        if next_page_token:
            logger.debug("Next page token available (not fetching additional pages)")
    else:
        logger.warning(f"Google Places API returned status '{data.get('status')}' for query '{query}'")
    
    # Note: Google Places API has rate limits and pagination tokens expire quickly
    # For simplicity, we'll only fetch the first page. You can extend this to handle pagination.
    
    return results

def format_place_data(place_result: Dict, category: str, city: str) -> Dict:
    """
    Format place data from Text Search result
    """
    geometry = place_result.get("geometry", {})
    location = geometry.get("location", {})
    
    return {
        "place_id": place_result.get("place_id"),
        "name": place_result.get("name"),
        "address": place_result.get("formatted_address"),
        "city": city,
        "category": category,
        "latitude": location.get("lat"),
        "longitude": location.get("lng"),
        "rating": place_result.get("rating"),
        "user_ratings_total": place_result.get("user_ratings_total"),
        "business_status": place_result.get("business_status"),
        "types": json.dumps(place_result.get("types", [])),
        "has_details": False
    }

def format_place_details(place_details: Dict) -> Dict:
    """
    Format place data from Place Details result
    """
    result = place_details.get("result", {})
    geometry = result.get("geometry", {})
    location = geometry.get("location", {})
    opening_hours = result.get("opening_hours", {})
    
    return {
        "formatted_address": result.get("formatted_address"),
        "latitude": location.get("lat"),
        "longitude": location.get("lng"),
        "rating": result.get("rating"),
        "user_ratings_total": result.get("user_ratings_total"),
        "phone_number": result.get("formatted_phone_number"),
        "international_phone_number": result.get("international_phone_number"),
        "website": result.get("website"),
        "business_status": result.get("business_status"),
        "types": json.dumps(result.get("types", [])),
        "opening_hours": json.dumps(opening_hours.get("weekday_text", [])) if opening_hours.get("weekday_text") else None,
        "price_level": result.get("price_level"),
        "has_details": True
    }

