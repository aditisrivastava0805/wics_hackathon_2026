import os
import requests
from datetime import datetime
from typing import Any, List
from urllib.parse import urlparse

SERPAPI_BASE = "https://serpapi.com/search"
DEFAULT_QUERY = "Concerts in Austin"
DEFAULT_LOCATION = "Austin, TX, USA"

# Music filter keywords
MUSIC_KEYWORDS = [
    "concert", "live music", "tour", "band", "singer", "artist", "music",
    "acoustic", "rock", "pop", "country", "jazz", "indie", "folk", "r&b",
    "hip-hop", "hip hop", "electronic", "edm", "blues", "metal", "punk",
    "nightclub", "venue", "tickets", "song",
]
NON_MUSIC_KEYWORDS = ["comedy", "murder mystery", "theatre", "theater", "ballet"]

FALLBACK_IMAGE_URL = "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800"

def _is_valid_image_url(value: Any) -> bool:
    if not value or not isinstance(value, str): return False
    value = value.strip()
    if value.startswith("data:") or value.startswith("base64") or len(value) > 2000: return False
    try:
        parsed = urlparse(value)
        return parsed.scheme in ("http", "https") and bool(parsed.netloc)
    except Exception: return False

def _normalize_image_url(raw: Any) -> Any:
    if not raw: return None
    if isinstance(raw, str) and _is_valid_image_url(raw): return raw
    if isinstance(raw, dict):
        for key in ("thumbnail", "image", "src"):
            v = raw.get(key)
            if isinstance(v, str) and _is_valid_image_url(v): return v
    return None

def _extract_price(event: dict) -> str:
    ticket_info = event.get("ticket_info") or []
    if ticket_info and isinstance(ticket_info, list):
        price = ticket_info[0].get("price") or ticket_info[0].get("extracted_price")
        if price: return f"${price}" if isinstance(price, (int, float)) else str(price)
    return "See tickets"

def _is_music_event(event: dict) -> bool:
    title = (event.get("title") or "").lower()
    desc = (event.get("description") or "").lower()
    text = f"{title} {desc}"
    if any(bad in text for bad in NON_MUSIC_KEYWORDS): return False
    return any(good in text for good in MUSIC_KEYWORDS)

def _clean_event_to_concert(raw: dict, index: int) -> dict:
    venue_obj = raw.get("venue") or {}
    venue_name = venue_obj.get("name") if isinstance(venue_obj, dict) else str(venue_obj)
    
    image_url = _normalize_image_url(raw.get("thumbnail")) or _normalize_image_url(raw.get("image"))
    if not image_url: image_url = FALLBACK_IMAGE_URL

    # Date parsing
    raw_date = raw.get("date", {})
    start_date = raw_date.get("start_date")
    
    return {
        "id": raw.get("event_id"),
        "name": (raw.get("title") or "").strip(),
        "venue": venue_name or "Austin, TX",
        "date": start_date,
        "imageUrl": image_url,
        "priceRange": _extract_price(raw),
        "link": (raw.get("link") or "").strip(),
        "description": (raw.get("description") or "").strip(),
    }

def fetch_google_events_page(query: str, start: int = 0, date_filter: str = None) -> List[dict]:
    """Fetches a single page (10 results) from SerpAPI."""
    key = "71c0636493ef472f0a0eb4e5b87190f9189367cdae46f29d52884ffc3b667824"
    if not key:
        print("❌ ERROR: SERPAPI_API_KEY not found in environment variables.")
        return []

    params = {
        "engine": "google_events",
        "q": query,
        "hl": "en",
        "gl": "us",
        "api_key": key,
        "start": start,  # Pagination offset
    }
    
    # Optional date filters: 'date:today', 'date:next_month', etc.
    if date_filter:
        params["htichips"] = f"date:{date_filter}"

    try:
        r = requests.get(SERPAPI_BASE, params=params, timeout=15)
        r.raise_for_status()
        return r.json().get("events_results", [])
    except Exception as e:
        print(f"❌ SerpAPI Request Failed: {e}")
        return []

def get_concerts_in_austin(music_only: bool = True, max_results: int = 50) -> List[dict]:
    """
    Loops through multiple pages to find concerts later in the year.
    """
    all_cleaned = []
    # We fetch in chunks of 10. To get a full year, we loop several times.
    # Note: SerpAPI counts each page as 1 search credit.
    pages_to_fetch = 5 
    
    print(f"🚀 Fetching up to {pages_to_fetch} pages of events...")

    for page in range(pages_to_fetch):
        start_offset = page * 10
        raw_events = fetch_google_events_page(DEFAULT_QUERY, start=start_offset)
        
        if not raw_events:
            break
            
        for i, ev in enumerate(raw_events):
            if _is_music_event(ev):
                concert = _clean_event_to_concert(ev, start_offset + i)
                all_cleaned.append(concert)
                
            if len(all_cleaned) >= max_results:
                return all_cleaned

    return all_cleaned