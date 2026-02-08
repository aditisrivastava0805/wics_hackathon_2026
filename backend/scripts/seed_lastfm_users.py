"""
seed_lastfm_users.py
Creates 5 'Fake' UT Students but connects them to REAL Last.fm accounts.
This populates your DB with real listening data (hundreds of artists) for testing compatibility.
"""

import firebase_admin
from firebase_admin import credentials, firestore
import sys
import os

# --- PATH SETUP ---
# This ensures we can import from the 'services' folder even if running from 'scripts/'
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

try:
    from services.lastfm import fetch_lastfm_taste
except ImportError:
    print("❌ ERROR: Could not import 'fetch_lastfm_taste'. Make sure you are in the 'backend' folder.")
    sys.exit(1)

# --- CONFIGURATION ---
KEY_PATH = 'serviceAccountKey.json' # Make sure this file is in backend/

# Initialize Firebase
if not firebase_admin._apps:
    if not os.path.exists(KEY_PATH):
        print(f"❌ ERROR: Could not find {KEY_PATH}.")
        sys.exit(1)
    cred = credentials.Certificate(KEY_PATH)
    firebase_admin.initialize_app(cred)

db = firestore.client()

# --- REAL LAST.FM USERS TO MIMIC ---
# We map a Fake UT Student -> A Real Last.fm Username
TEST_USERS = [
    {
        "name": "Indie Ian",
        "email": "ian@utexas.edu",
        "lastfm": "rj",  # Founder of Last.fm (Huge history)
        "budget": "flexible",
        "vibes": ["Chill", "Indie Listening"]
    },
    {
        "name": "Pop Princess",
        "email": "pop@utexas.edu",
        "lastfm": "cherie", # Likely pop/variety
        "budget": "under40",
        "vibes": ["Sing-along", "Dance"]
    },
    {
        "name": "Rock Rick",
        "email": "rick@utexas.edu",
        "lastfm": "b", # Short username, usually old/rock
        "budget": "40to80",
        "vibes": ["Mosh Pit", "Loud"]
    },
    {
        "name": "HipHop Harry",
        "email": "harry@utexas.edu",
        "lastfm": "j", # Another short username
        "budget": "flexible",
        "vibes": ["Dance", "Energy"]
    },
    {
        "name": "Vibe Vanessa",
        "email": "vanessa@utexas.edu",
        "lastfm": "monstermuffin", # Random active user
        "budget": "under40",
        "vibes": ["Chill", "Intimate"]
    }
]

def seed_lastfm_users():
    print("🚀 Starting Last.fm Seeding...")
    print("--------------------------------")

    users_ref = db.collection('users')

    for user in TEST_USERS:
        print(f"🎵 Fetching Last.fm data for {user['lastfm']} ({user['name']})...")
        
        # 1. CALL YOUR SERVICE (Real API Call)
        taste_data = fetch_lastfm_taste(user['lastfm'])
        
        if not taste_data:
            print(f"⚠️ Skipped {user['name']} (API failed or user not found).")
            continue

        # 2. Prepare Firebase Document
        user_doc = {
            "name": user['name'],
            "email": user['email'],
            "is_verified": True,
            "profile_image": f"https://api.dicebear.com/7.x/initials/svg?seed={user['name']}",
            
            # The Real Music Data
            "lastfm_username": user['lastfm'],
            "music_preferences": taste_data,
            "last_synced": firestore.SERVER_TIMESTAMP,
            
            # Other Profile Stuff
            "budget": user['budget'],
            "concert_vibes": user['vibes'],
            "created_at": firestore.SERVER_TIMESTAMP
        }

        # 3. Save to Firestore
        users_ref.document(user['email']).set(user_doc, merge=True)
        print(f"✅ Saved {user['name']}! (Artists: {len(taste_data['artists'])}, Genres: {len(taste_data['genres'])})")

    print("--------------------------------")
    print("✨ DONE! You now have 5 users with REAL music taste.")

if __name__ == "__main__":
    seed_lastfm_users()