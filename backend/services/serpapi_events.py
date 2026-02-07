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

# Keywords that suggest a music/concert event (title or description)
MUSIC_KEYWORDS = [
    "concert", "live music", "tour", "band", "singer", "artist", "music",
    "acoustic", "rock", "pop", "country", "jazz", "indie", "folk", "r&b",
    "hip-hop", "hip hop", "electronic", "edm", "blues", "metal", "punk",
    "nightclub", "venue", "tickets", "spotify.com/concert", "song",
]
# Keywords that suggest NON-music (exclude these)
NON_MUSIC_KEYWORDS = [
    "comedy", "murder mystery", "dinner show", "theatre", "theater",
    "ballet", "nutcracker", "market at", "festival"  # keep "music festival" via music match
]

# Placeholder image when API returns base64 or invalid URL (optional)
FALLBACK_IMAGE_URL = "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800"


def _is_valid_image_url(value: Any) -> bool:
    """Return True only if value is a string that is an accessible HTTP(S) URL (not base64/data)."""
    if not value or not isinstance(value, str):
        return False
    value = value.strip()
    if value.startswith("data:") or value.startswith("base64") or len(value) > 2000:
        return False
    try:
        parsed = urlparse(value)
        return parsed.scheme in ("http", "https") and bool(parsed.netloc)
    except Exception:
        return False


def _normalize_image_url(raw: Any) -> Any:
    """
    Ensure we only use accessible URLs for concert images.
    SerpAPI sometimes returns base64 or data URLs; those are rejected.
    """
    if not raw:
        return None
    if isinstance(raw, str) and _is_valid_image_url(raw):
        return raw
    if isinstance(raw, dict):
        for key in ("thumbnail", "image", "src"):
            v = raw.get(key)
            if isinstance(v, str) and _is_valid_image_url(v):
                return v
    return None


def _parse_event_date(event: dict) -> Any:
    """Parse event date from SerpAPI date.start_date and date.when. Prefer when for time."""
    date_obj = event.get("date") or {}
    when = (date_obj.get("when") or "").strip()
    start_date = (date_obj.get("start_date") or "").strip()

    # Try to get a full date from "when" (e.g. "Sun, Dec 7, 8:00 – 9:30 PM CST")
    if when:
        # Pattern: "Sun, Dec 7, 8:00" or "Dec 7, 8:00" or "Dec 2, 9:00 PM – Dec 30, 10:30 PM"
        for part in when.split("–")[0].split(","):
            part = part.strip()
            try:
                # "Dec 7" or "Dec 7 8:00"
                parsed = datetime.strptime(part, "%b %d")
            except ValueError:
                try:
                    parsed = datetime.strptime(part, "%b %d %I:%M")
                except ValueError:
                    try:
                        parsed = datetime.strptime(part, "%b %d %I:%M %p")
                    except ValueError:
                        continue
                year = datetime.now().year
                if parsed < datetime.now():
                    year += 1
                return parsed.replace(year=year)
            year = datetime.now().year
            if parsed.replace(year=year) < datetime.now():
                year += 1
            return parsed.replace(year=year)

    if start_date:
        try:
            parsed = datetime.strptime(start_date.strip(), "%b %d")
            year = datetime.now().year
            if parsed.replace(year=year) < datetime.now():
                year += 1
            return parsed.replace(year=year)
        except ValueError:
            pass
    return None


def _is_music_event(event: dict) -> bool:
    """Heuristic: keep events that look like music/concerts, drop comedy/theater/etc."""
    title = (event.get("title") or "").lower()
    desc = (event.get("description") or "").lower()
    text = f"{title} {desc}"

    for bad in NON_MUSIC_KEYWORDS:
        if bad in text:
            return False

    for good in MUSIC_KEYWORDS:
        if good in text:
            return True

    # Ticket sources often indicate music (Spotify, Ticketmaster, SeatGeek for concerts)
    ticket_sources = [
        (t.get("source") or "").lower()
        for t in (event.get("ticket_info") or [])
    ]
    if "spotify" in str(ticket_sources) or "spotify.com" in text:
        return True
    if "ticketmaster" in str(ticket_sources) and ("concert" in text or "tour" in text or "band" in text):
        return True

    return False


def _extract_price(event: dict) -> str:
    """Get price string for display."""
    ticket_info = event.get("ticket_info") or []
    for t in ticket_info:
        price = t.get("price") or t.get("extracted_price")
        if price is not None:
            if isinstance(price, (int, float)):
                return f"${int(price)}+"
            return str(price).strip()
    return "See tickets"


def _clean_event_to_concert(raw: dict, index: int) -> dict:
    """
    Turn one SerpAPI event result into a clean concert-like object.
    Uses normalized image URL (never base64).
    """
    venue_obj = raw.get("venue") or {}
    venue_name = venue_obj.get("name") if isinstance(venue_obj, dict) else str(venue_obj)
    if not venue_name and isinstance(raw.get("address"), list) and raw["address"]:
        venue_name = raw["address"][0] if raw["address"] else "Austin, TX"

    title = (raw.get("title") or "").strip() or "Concert"
    image_url = _normalize_image_url(raw.get("thumbnail")) or _normalize_image_url(raw.get("image"))
    if not image_url:
        image_url = FALLBACK_IMAGE_URL  # optional: use None to have no image

    event_date = _parse_event_date(raw)
    date_str = event_date.isoformat() if event_date else None

    return {
        "name": title,
        "artist": title,  # SerpAPI often doesn't separate; use title as artist
        "venue": venue_name or "Austin, TX",
        "date": date_str,
        "imageUrl": image_url,
        "genre": "Concert",  # Could infer from keywords later
        "priceRange": _extract_price(raw),
        "link": (raw.get("link") or "").strip() or None,
        "description": (raw.get("description") or "").strip() or None,
        "source_index": index,
    }


def fetch_google_events(
    query: str = DEFAULT_QUERY,
    location: str = DEFAULT_LOCATION,
    api_key: Any = None,
    start: int = 0,
) -> List[dict]:
    """
    Query SerpAPI Google Events and return raw events_results list.
    """
    key = api_key or os.environ.get("SERPAPI_API_KEY")
    if not key:
        return []

    params = {
        "engine": "google_events",
        "q": query,
        "location": location,
        "hl": "en",
        "gl": "us",
        "api_key": key,
        "start": start,
    }
    try:
        r = requests.get(SERPAPI_BASE, params=params, timeout=15)
        r.raise_for_status()
        data = r.json()
        return (data.get("events_results") or [])
    except Exception:
        return []


def get_concerts_in_austin(
    query: str = DEFAULT_QUERY,
    from_date: Any = None,
    music_only: bool = True,
    max_results: int = 50,
) -> List[dict]:
    """
    Fetch "Concerts in Austin" from SerpAPI, clean JSON, normalize images, and filter.

    - Cleans messy JSON into a nice list of concert-like objects.
    - Ensures imageUrl is always an accessible URL (never base64).
    - If music_only: keeps only events that look like music/concerts.
    - If from_date: only events on or after that date (default: today).
    """
    raw_events = fetch_google_events(query=query)
    if not raw_events:
        return []

    from_date = from_date or datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    cleaned: list[dict] = []

    for i, ev in enumerate(raw_events):
        if music_only and not _is_music_event(ev):
            continue
        concert = _clean_event_to_concert(ev, i)
        # Date filter
        if concert.get("date"):
            try:
                ev_dt = datetime.fromisoformat(concert["date"].replace("Z", "+00:00"))
                # naive compare if from_date is naive
                if ev_dt.replace(tzinfo=None) < from_date:
                    continue
            except (ValueError, TypeError):
                pass
        cleaned.append(concert)
        if len(cleaned) >= max_results:
            break

    return cleaned
