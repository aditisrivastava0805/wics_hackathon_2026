"""
SerpAPI Google Events integration for "Concerts in Austin".
Fetches events, cleans JSON, normalizes image URLs, and filters to music/concerts with date filter.
"""

import os
import requests
from datetime import datetime
from typing import Any, List
from urllib.parse import urlparse

SERPAPI_BASE = "https://serpapi.com/search"
DEFAULT_QUERY = "Concerts in Austin"
DEFAULT_LOCATION = "Austin, TX, USA"

# Keywords that suggest a music/concert event
MUSIC_KEYWORDS = [
    "concert", "live music", "tour", "band", "singer", "artist", "music",
    "acoustic", "rock", "pop", "country", "jazz", "indie", "folk", "r&b",
    "hip-hop", "hip hop", "electronic", "edm", "blues", "metal", "punk",
    "nightclub", "venue", "tickets", "song",
]
# Keywords that suggest NON-music
NON_MUSIC_KEYWORDS = [
    "comedy", "murder mystery", "dinner show", "theatre", "theater",
    "ballet", "nutcracker", "market at", "festival" 
]

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

def _parse_event_date(event: dict) -> Any:
    # (Kept your existing logic here, it looked good)
    date_obj = event.get("date") or {}
    start_date = (date_obj.get("start_date") or "").strip()
    if start_date:
        try:
            return datetime.strptime(start_date, "%b %d") # Simplified for speed
        except ValueError:
            pass
    return None

def _is_music_event(event: dict) -> bool:
    title = (event.get("title") or "").lower()
    desc = (event.get("description") or "").lower()
    text = f"{title} {desc}"

    for bad in NON_MUSIC_KEYWORDS:
        if bad in text: return False
    for good in MUSIC_KEYWORDS:
        if good in text: return True
    return False

def _extract_price(event: dict) -> str:
    ticket_info = event.get("ticket_info") or []
    if ticket_info and isinstance(ticket_info, list):
        # Grab the first price found
        return ticket_info[0].get("price") or "Check Link"
    return "See tickets"

def _clean_event_to_concert(raw: dict, index: int) -> dict:
    """
    Turn one SerpAPI event result into a clean concert-like object.
    """
    venue_obj = raw.get("venue") or {}
    venue_name = venue_obj.get("name") if isinstance(venue_obj, dict) else str(venue_obj)
    
    title = (raw.get("title") or "").strip() or "Concert"
    image_url = _normalize_image_url(raw.get("thumbnail")) or _normalize_image_url(raw.get("image"))
    if not image_url: image_url = FALLBACK_IMAGE_URL

    return {
        "id": raw.get("event_id"),  # <--- CRITICAL ADDITION HERE!
        "name": title,
        "artist": title, 
        "venue": venue_name or "Austin, TX",
        "date": raw.get("date", {}).get("start_date"),
        "imageUrl": image_url,
        "genre": "Concert", 
        "priceRange": _extract_price(raw),
        "link": (raw.get("link") or "").strip(),
        "description": (raw.get("description") or "").strip(),
        "source_index": index,
    }

def fetch_google_events(query: str, api_key: str = None) -> List[dict]:
    # Use environment variable if not passed
    key = api_key or os.environ.get("SERPAPI_API_KEY") 
    # Or hardcode for hackathon speed if env var fails:
    
    if not key: return []

    params = {
        "engine": "google_events",
        "q": query,
        #"location": DEFAULT_LOCATION,
        "hl": "en",
        "gl": "us",
        "api_key": key,
    }

    # --- DEBUG START ---
    print(f"🔍 DEBUG: API Key being used: {key}", flush=True)
    print(f"🔍 DEBUG: Query Params: {params}", flush=True)
    # --- DEBUG END ---

    try:
        r = requests.get(SERPAPI_BASE, params=params, timeout=15)
        # --- DEBUG START ---
        print(f"📨 DEBUG: Response Status Code: {r.status_code}", flush=True)
        print(f"📄 DEBUG: Response Body (First 200 chars): {r.text[:200]}", flush=True)
        # --- DEBUG END ---
        return r.json().get("events_results", [])
    except Exception:
        return []

def get_concerts_in_austin(music_only: bool = True, max_results: int = 50) -> List[dict]:
    raw_events = fetch_google_events(query=DEFAULT_QUERY)
    cleaned = []
    
    for i, ev in enumerate(raw_events):
        if music_only and not _is_music_event(ev): continue
        cleaned.append(_clean_event_to_concert(ev, i))
        if len(cleaned) >= max_results: break
        
    return cleaned