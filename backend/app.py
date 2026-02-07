from flask import Flask, jsonify, request
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore
import os
from dotenv import load_dotenv  # <--- NEW LINE

from flask import Flask, jsonify, request
from services.serpapi_events import get_concerts_in_austin

load_dotenv()
app = Flask(__name__)
CORS(app)

# --- FIREBASE SETUP ---
# We check if the key file exists so the app doesn't crash immediately if you haven't added it yet.
if os.path.exists('serviceAccountKey.json'):
    cred = credentials.Certificate('serviceAccountKey.json')
    firebase_admin.initialize_app(cred)
    db = firestore.client()
    print("Firebase Connected!")
else:
    print("WARNING: serviceAccountKey.json not found. Database features won't work yet.")
    db = None

@app.route('/', methods=['GET'])
def home():
    return "Server is running! Your backend is alive."

@app.route('/test-db', methods=['GET'])
def test_db():
    if not db:
        return jsonify({"error": "No Database Connection"}), 500
    
    # Try to read the 'users' collection to see if it works
    users_ref = db.collection('users')
    return jsonify({"message": "Database connection verified!"})


# --- SERPAPI EVENTS (Concerts in Austin) ---
@app.route('/api/events', methods=['GET'])
def api_events():
    """
    GET /api/events?music_only=1&max=50
    Returns cleaned list of concerts in Austin from Google Events (SerpAPI).
    Images are normalized to URLs only (no base64). Results are filtered to music and by date.
    """
    try:
        music_only = request.args.get('music_only', 'true').lower() in ('1', 'true', 'yes')
        max_results = min(100, max(1, int(request.args.get('max', 50))))
        concerts = get_concerts_in_austin(
            music_only=music_only,
            max_results=max_results,
        )
        return jsonify({"data": concerts})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000)