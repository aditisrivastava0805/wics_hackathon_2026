"""
Service for fetching user music taste from Last.fm API.
Ported from TypeScript to Python.
"""
import requests
import os

# 👇 HARDCODE YOUR LAST.FM KEY HERE FOR THE HACKATHON

LASTFM_API_KEY="7903e6d2362f5830b453c95beaf5c9e0"
LASTFM_BASE_URL = "https://ws.audioscrobbler.com/2.0/"

def fetch_lastfm_taste(username: str):
    """
    Fetches top artists (as artists) and top tags (as genres) for a given Last.fm username.
    Returns: {'artists': ['Taylor Swift', ...], 'genres': ['pop', ...]}
    """
    if not username or not LASTFM_API_KEY:
        print("❌ LAST.FM ERROR: Missing Username or API Key")
        return None

    try:
        # 1. Fetch Top Artists
        params_artists = {
            'method': 'user.gettopartists',
            'user': username,
            'api_key': LASTFM_API_KEY,
            'format': 'json',
            'limit': 30,
            'period': '12month' # Get last year's data for relevance
        }
        r_artists = requests.get(LASTFM_BASE_URL, params=params_artists, timeout=5)
        data_artists = r_artists.json()
        
        # Parse Artists
        artists = []
        if 'topartists' in data_artists:
            for artist in data_artists['topartists'].get('artist', []):
                artists.append(artist['name'])

        # 2. Fetch Top Tags (We use this as "Genres")
        # Last.fm doesn't have a direct "user.getTopGenres", so we use "user.getTopTags"
        # OR we can infer genres from the top artists (better for compatibility).
        # Let's stick to your TS logic: user.getTopTags
        params_tags = {
            'method': 'user.gettoptags',
            'user': username,
            'api_key': LASTFM_API_KEY,
            'format': 'json',
            'limit': 15
        }
        r_tags = requests.get(LASTFM_BASE_URL, params=params_tags, timeout=5)
        data_tags = r_tags.json()

        # Parse Genres (Tags)
        genres = []
        if 'toptags' in data_tags:
            for tag in data_tags['toptags'].get('tag', []):
                genres.append(tag['name'].title()) # Capitalize "pop" -> "Pop"

        print(f"✅ Last.fm Sync for {username}: Found {len(artists)} artists, {len(genres)} genres.")
        
        return {
            "artists": artists,
            "genres": genres
        }

    except Exception as e:
        print(f"❌ LAST.FM CRASH: {str(e)}")
        return None