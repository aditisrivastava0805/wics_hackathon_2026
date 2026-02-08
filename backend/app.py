from flask import Flask, jsonify, request
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore
import os
from dotenv import load_dotenv


from services.serpapi_events import get_concerts_in_austin
from services.compatibility import calculate_compatibility 
from services.lastfm import fetch_lastfm_taste
import datetime 

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
    print("📥 GET /api/events received")
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

# ==========================================
# 🆕 USER REGISTRATION & UT VERIFICATION
# ==========================================

@app.route('/api/register', methods=['POST'])
def register_user():
    """
    POST /api/register
    Body: { "email": "alex@utexas.edu", "name": "Alex", "music_preferences": {...} }
    Saves user to Firebase and verifies UT email.
    """
    if not db: return jsonify({"error": "DB not connected"}), 500

    data = request.json
    email = data.get('email', '').strip().lower()
    
    if not email:
        return jsonify({"error": "Email is required"}), 400

    # 1. UT Verification Check
    is_verified = email.endswith('utexas.edu') or email.endswith('austin.utexas.edu')

    # 2. Prepare User Document
    user_doc = {
        "name": data.get("name"),
        "email": email,
        "is_verified": is_verified,
        "music_preferences": data.get("music_preferences", {"artists": [], "genres": []}),
        "budget": data.get("budget", "flexible"),
        "concert_vibes": data.get("concert_vibes", []),
        "created_at": firestore.SERVER_TIMESTAMP,
        "profile_image": data.get("profile_image", "")
    }

    # 3. Save to Firestore (Merge=True updates existing users without deleting old fields)
    try:
        db.collection('users').document(email).set(user_doc, merge=True)
        return jsonify({
            "success": True, 
            "verified": is_verified, 
            "message": "User profile updated!"
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ==========================================
# 🆕 MATCHING ALGORITHM (The Core Logic)
# ==========================================

@app.route('/api/match', methods=['POST'])
def get_matches():
    """
    POST /api/match
    Body: { "user_email": "me@ut.edu", "concert_id": "optional-concert-id" }
    Returns sorted list of compatible users.
    """
    if not db: return jsonify({"error": "DB not connected"}), 500

    data = request.json
    current_email = data.get('user_email')
    
    # 1. Get the Current User's Profile
    me_ref = db.collection('users').document(current_email).get()
    if not me_ref.exists:
        return jsonify({"error": "User not found"}), 404
    me = me_ref.to_dict()

    # 2. Get Potential Matches
    # (MVP: Fetch all users. Scale Up: Filter by active/concert later)
    users_ref = db.collection('users').stream()
    
    matches = []

    for user_doc in users_ref:
        other_user = user_doc.to_dict()
        other_email = other_user.get('email')

        # Skip yourself
        if other_email == current_email:
            continue
            
        # 3. RUN THE ALGORITHM 🧠
        score = calculate_compatibility(me, other_user)
        
        # Only show people with decent compatibility (>40%)? Optional.
        if score > 0:
            matches.append({
                "email": other_email,
                "name": other_user.get("name"),
                "score": score,
                "common_artists": list(set(me.get('music_preferences', {}).get('artists', [])) & set(other_user.get('music_preferences', {}).get('artists', []))),
                "budget": other_user.get("budget"),
                "verified": other_user.get("is_verified", False)
            })

    # 4. Sort by Score (Highest First)
    matches.sort(key=lambda x: x['score'], reverse=True)

    # Return top 20 matches
    return jsonify({"matches": matches[:20]})

 # ==========================================
# 🎵 SYNC LAST.FM DATA
# ==========================================

@app.route('/api/sync-lastfm', methods=['POST'])
def sync_lastfm():
    """
    POST /api/sync-lastfm
    Body: { "email": "user@ut.edu", "lastfm_username": "rj" }
    Fetches data from Last.fm and updates the user's Firebase profile.
    """
    if not db: return jsonify({"error": "DB not connected"}), 500

    data = request.json
    email = data.get('email')
    lastfm_username = data.get('lastfm_username')

    if not email or not lastfm_username:
        return jsonify({"error": "Missing email or username"}), 400

    # 1. Fetch from Last.fm
    taste_data = fetch_lastfm_taste(lastfm_username)
    
    if not taste_data:
        return jsonify({"error": "Failed to fetch from Last.fm. Check username."}), 404

    # 2. Save to Firebase
    # We MERGE this into the existing music_preferences
    try:
        user_ref = db.collection('users').document(email)
        
        # We prefer Last.fm data over manual entry if synced
        user_ref.set({
            "lastfm_username": lastfm_username,
            "music_preferences": taste_data, # Overwrite with real data
            "last_synced": firestore.SERVER_TIMESTAMP
        }, merge=True)
        
        return jsonify({
            "success": True, 
            "message": "Music taste synced!",
            "data": taste_data
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================
# 🎟️ CONCERT ROOMS (The Social Layer)
# ==========================================

@app.route('/api/rooms/join', methods=['POST'])
def join_room():
    """
    POST /api/rooms/join
    Body: { "user_email": "me@ut.edu", "concert_id": "serpapi-123", "concert_name": "Eras Tour" }
    Adds the user to the "interested" list for this concert.
    """
    if not db: return jsonify({"error": "DB not connected"}), 500

    data = request.json
    email = data.get('user_email')
    concert_id = data.get('concert_id')
    concert_name = data.get('concert_name')
    
    if not email or not concert_id:
        return jsonify({"error": "Missing email or concert_id"}), 400

    try:
        # 1. Add User to the Concert's "Attendees" list
        # We use the concert_id as the Document ID in a 'concerts' collection
        concert_ref = db.collection('concerts').document(concert_id)
        
        # We use array_union so we don't overwrite other people
        concert_ref.set({
            "name": concert_name,
            "attendees": firestore.ArrayUnion([email]),
            "last_active": firestore.SERVER_TIMESTAMP
        }, merge=True)
        
        # 2. Also add the Concert to the User's "My Events" list (create user doc if missing)
        user_ref = db.collection('users').document(email)
        if user_ref.get().exists:
            user_ref.update({"my_concerts": firestore.ArrayUnion([concert_id])})
        else:
            user_ref.set({"my_concerts": [concert_id]}, merge=True)

        return jsonify({"success": True, "message": f"Joined room for {concert_name}!"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/rooms/joined', methods=['GET'])
def check_joined():
    """
    GET /api/rooms/joined?concert_id=...&user_email=...
    Returns { "joined": true } if user is in the room, else { "joined": false }.
    """
    concert_id = request.args.get('concert_id')
    user_email = request.args.get('user_email')
    if not concert_id or not user_email:
        return jsonify({"joined": False})
    try:
        concert_doc = db.collection('concerts').document(concert_id).get()
        if not concert_doc.exists:
            return jsonify({"joined": False})
        attendees = concert_doc.to_dict().get('attendees', [])
        return jsonify({"joined": user_email in attendees})
    except Exception:
        return jsonify({"joined": False})


@app.route('/api/rooms/people', methods=['GET'])
def get_room_people():
    """
    GET /api/rooms/people?concert_id=serpapi-123&user_email=me@ut.edu
    Returns a SORTED list of people in this room, ranked by compatibility.
    """
    concert_id = request.args.get('concert_id')
    current_email = request.args.get('user_email')
    
    if not concert_id or not current_email:
        return jsonify({"error": "Missing params"}), 400
        
    try:
        # 1. Get the list of emails in this room
        concert_doc = db.collection('concerts').document(concert_id).get()
        if not concert_doc.exists:
            return jsonify({"people": []}) # Room is empty
            
        attendee_emails = concert_doc.to_dict().get('attendees', [])
        
        # 2. Get the Current User's Profile (for matching)
        me_ref = db.collection('users').document(current_email).get()
        if not me_ref.exists:
            return jsonify({"error": "User not found"}), 404
            
        me_profile = me_ref.to_dict()
        
        # 3. Fetch Profiles of Everyone Else & Calculate Score
        matches = []
        
        for email in attendee_emails:
            if email == current_email: continue # Skip yourself
            
            # Fetch the other person's profile
            other_ref = db.collection('users').document(email).get()
            if not other_ref.exists: continue
            
            other_profile = other_ref.to_dict()
            
            # 🔥 RUN THE COMPATIBILITY ALGO
            score = calculate_compatibility(me_profile, other_profile)
            
            matches.append({
                "email": email,
                "name": other_profile.get("name"),
                "score": score,
                "avatar": other_profile.get("profile_image"),
                # Calculate shared artists for display
                "common_artists": list(set(me_profile.get('music_preferences', {}).get('artists', [])) & set(other_profile.get('music_preferences', {}).get('artists', []))),
                "verified": other_profile.get("is_verified", False)
            })
            
        # 4. Sort by Score (Best Match First)
        matches.sort(key=lambda x: x['score'], reverse=True)
        
        return jsonify({"people": matches})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ==========================================
# 💬 CONCERT ROOM CHAT (Group Chat)
# ==========================================

@app.route('/api/rooms/chat', methods=['POST'])
def send_room_message():
    """
    POST /api/rooms/chat
    Body: { "concert_id": "123", "user_email": "me@ut.edu", "content": "Anyone driving?" }
    Saves a message to the concert's message sub-collection.
    """
    if not db: return jsonify({"error": "DB not connected"}), 500

    data = request.json
    concert_id = data.get('concert_id')
    user_email = data.get('user_email')
    content = data.get('content', '').strip()
    
    if not concert_id or not user_email or not content:
        return jsonify({"error": "Missing fields"}), 400

    try:
        # 1. Get User Details (for the avatar/name in chat)
        user_ref = db.collection('users').document(user_email).get()
        if not user_ref.exists:
            return jsonify({"error": "User not found"}), 404
        
        user_data = user_ref.to_dict()
        
        # 2. Create the Message Object
        message_data = {
            "user_email": user_email,
            "user_name": user_data.get("name", "Unknown"),
            "avatar": user_data.get("profile_image", ""),
            "content": content,
            "timestamp": firestore.SERVER_TIMESTAMP # Server time is safest
        }
        
        # 3. Save to: concerts/{concert_id}/messages/{message_id}
        # We use a sub-collection 'messages' inside the concert document
        db.collection('concerts').document(concert_id).collection('messages').add(message_data)
        
        return jsonify({"success": True, "message": "Sent!"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/rooms/chat', methods=['GET'])
def get_room_messages():
    """
    GET /api/rooms/chat?concert_id=123
    Returns list of messages sorted by time (Oldest -> Newest).
    """
    concert_id = request.args.get('concert_id')
    
    if not concert_id:
        return jsonify({"error": "Missing concert_id"}), 400
        
    try:
        # 1. Query the 'messages' sub-collection
        messages_ref = db.collection('concerts').document(concert_id).collection('messages')
        
        # 2. Sort by time
        query = messages_ref.order_by('timestamp', direction=firestore.Query.ASCENDING)
        
        results = []
        for doc in query.stream():
            msg = doc.to_dict()
            results.append(msg)
            
        return jsonify({"messages": results})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
    # ==========================================
# 🤝 ONE-ON-ONE CONNECTIONS (The "Match" Action)
# ==========================================

@app.route('/api/connect/request', methods=['POST'])
def request_connection():
    """
    POST /api/connect/request
    Body: { "requester_email": "me@ut.edu", "recipient_email": "ian@ut.edu", "concert_id": "123" }
    """
    if not db: return jsonify({"error": "DB not connected"}), 500

    data = request.json
    requester = data.get('requester_email')
    recipient = data.get('recipient_email')
    concert_id = data.get('concert_id')

    if not requester or not recipient or not concert_id:
        return jsonify({"error": "Missing fields"}), 400

    # Create a unique ID for this connection (e.g., "concert123_userA_userB")
    # We sort emails alphabetically so A->B and B->A produce the SAME ID
    sorted_emails = sorted([requester, recipient])
    connection_id = f"{concert_id}_{sorted_emails[0]}_{sorted_emails[1]}"

    try:
        # Check if already connected
        doc_ref = db.collection('connections').document(connection_id)
        doc = doc_ref.get()
        
        if doc.exists:
            status = doc.to_dict().get('status')
            if status == 'accepted':
                return jsonify({"message": "Already connected!", "status": "accepted"})
            if status == 'pending':
                return jsonify({"message": "Request already sent.", "status": "pending"})

        # Create the Request
        doc_ref.set({
            "concert_id": concert_id,
            "requester": requester,
            "recipient": recipient,
            "participants": [requester, recipient],
            "status": "pending",
            "created_at": firestore.SERVER_TIMESTAMP
        })
        
        return jsonify({"success": True, "message": "Request sent!", "connection_id": connection_id})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/connect/accept', methods=['POST'])
def accept_connection():
    """
    POST /api/connect/accept
    Body: { "connection_id": "..." }
    Updates status to 'accepted' and unlocks private chat.
    """
    data = request.json
    connection_id = data.get('connection_id')
    
    if not connection_id: return jsonify({"error": "Missing ID"}), 400

    try:
        db.collection('connections').document(connection_id).update({
            "status": "accepted",
            "updated_at": firestore.SERVER_TIMESTAMP
        })
        return jsonify({"success": True, "message": "Connection accepted! Chat unlocked."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route('/api/connect/status', methods=['GET'])
def get_connection_status():
    """
    GET /api/connect/status?requester=me@ut.edu&recipient=ian@ut.edu&concert_id=123
    Checks if two people are connected.
    """
    requester = request.args.get('requester')
    recipient = request.args.get('recipient')
    concert_id = request.args.get('concert_id')

    if not requester or not recipient: return jsonify({"status": "none"})
    
    sorted_emails = sorted([requester, recipient])
    connection_id = f"{concert_id}_{sorted_emails[0]}_{sorted_emails[1]}"
    
    doc = db.collection('connections').document(connection_id).get()
    
    if doc.exists:
        return jsonify(doc.to_dict())
    else:
        return jsonify({"status": "none"})

if __name__ == '__main__':
    # Use 5001 to avoid macOS AirPlay Receiver on port 5000
    app.run(debug=True, port=5001)