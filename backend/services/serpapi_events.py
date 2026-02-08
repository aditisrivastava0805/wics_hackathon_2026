import hashlib
import os
import re
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

def _has_old_year(raw_date: dict) -> bool:
    """True if date text contains a year before 2024 (e.g. 2001)."""
    if not raw_date or not isinstance(raw_date, dict):
        return False
    text = " ".join(str(raw_date.get(k) or "") for k in ("start_date", "when"))
    for m in re.finditer(r"\b(19\d{2}|20[0-2]\d)\b", text):
        if int(m.group(1)) < 2024:
            return True
    return False


def _parse_event_date(raw_date: dict) -> datetime | None:
    """Parse event date from SerpAPI format. Returns None if unparseable or in the past."""
    if not raw_date or not isinstance(raw_date, dict):
        return None
    if _has_old_year(raw_date):
        return None
    start_date = raw_date.get("start_date")  # e.g. "Dec 7" or "Dec 7, 2025"
    when = raw_date.get("when")  # e.g. "Sun, Dec 7, 8:00 – 9:30 PM CST"
    if not start_date and not when:
        return None
    now = datetime.now()
    # Build list of strings to try: start_date, when, and comma-separated parts (e.g. "Dec 7" from "Sun, Dec 7, 8:00")
    candidates = []
    for raw in (start_date, when):
        if not raw:
            continue
        s = str(raw).strip()[:50]
        candidates.append(s)
        for part in s.split(","):
            t = part.strip()
            if t and t not in candidates:
                candidates.append(t)
    for text in candidates:
        for fmt in ("%b %d, %Y", "%b %d", "%Y-%m-%d", "%a, %b %d"):
            try:
                parsed = datetime.strptime(text, fmt)
                if parsed.year == 1900:
                    parsed = parsed.replace(year=now.year)
                    if parsed < now:
                        parsed = parsed.replace(year=now.year + 1)
                if parsed >= now:
                    return parsed
                return None  # past event
            except ValueError:
                continue
    return None


def _make_event_id(raw: dict, index: int) -> str:
    """Stable URL-safe id when SerpAPI does not provide event_id."""
    link = (raw.get("link") or "").strip()
    title = (raw.get("title") or "").strip()
    raw_id = (link or title) or str(index)
    digest = hashlib.sha256(raw_id.encode("utf-8")).digest()[:12]
    return digest.hex()


def _clean_event_to_concert(raw: dict, index: int) -> dict:
    venue_obj = raw.get("venue") or {}
    venue_name = venue_obj.get("name") if isinstance(venue_obj, dict) else str(venue_obj)
    
    image_url = _normalize_image_url(raw.get("thumbnail")) or _normalize_image_url(raw.get("image"))
    if not image_url: image_url = FALLBACK_IMAGE_URL

    raw_date = raw.get("date", {})
    start_date = raw_date.get("start_date") if isinstance(raw_date, dict) else None

    event_id = raw.get("event_id")
    if not event_id or not str(event_id).strip():
        event_id = _make_event_id(raw, index)
    else:
        event_id = str(event_id).strip()
    
    return {
        "id": event_id,
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
    key = os.environ.get("SERPAPI_API_KEY", "").strip()
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
        params["no_cache"] = "true"  # avoid cached results that ignore the date filter

    try:
        r = requests.get(SERPAPI_BASE, params=params, timeout=15)
        if r.status_code == 403:
            print("❌ SerpAPI returned 403 Forbidden. Common causes: invalid/expired API key, rate limit, or Google Events not on your plan. Check https://serpapi.com/manage-api-key")
            return []
        r.raise_for_status()
        return r.json().get("events_results", [])
    except requests.exceptions.HTTPError as e:
        print(f"❌ SerpAPI HTTP error: {e.response.status_code} - {e}")
        return []
    except Exception as e:
        print(f"❌ SerpAPI Request Failed: {e}")
        return []

def get_concerts_in_austin(music_only: bool = True, max_results: int = 50) -> List[dict]:
    """
    Fetches upcoming concerts in Austin. Uses SerpAPI date filter (this month + next month)
    and drops any event that parses to a date in the past.
    """
    all_cleaned = []
    # SerpAPI htichips: date:month = this month, date:next_month = next month
    date_filters = ["month", "next_month"]
    pages_per_filter = 2  # 2 pages per date range to limit credits

    print("🚀 Fetching upcoming events (this month + next month)...")

    for date_filter in date_filters:
        for page in range(pages_per_filter):
            start_offset = page * 10
            raw_events = fetch_google_events_page(
                DEFAULT_QUERY, start=start_offset, date_filter=date_filter
            )
            if not raw_events:
                break
            for i, ev in enumerate(raw_events):
                if not _is_music_event(ev):
                    continue
                # Only include if we can parse the date and it's upcoming (exclude no-date and past/old-year)
                parsed_dt = _parse_event_date(ev.get("date"))
                if parsed_dt is None:
                    continue
                concert = _clean_event_to_concert(ev, start_offset + i)
                # Use parsed date as ISO string so frontend displays correct year (avoids "Dec 7" → 2001)
                concert["date"] = parsed_dt.strftime("%Y-%m-%d")
                all_cleaned.append(concert)
                if len(all_cleaned) >= max_results:
                    return all_cleaned

    return all_cleaned