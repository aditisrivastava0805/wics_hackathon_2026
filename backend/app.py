from flask import Flask, jsonify, request
from flask_cors import CORS
import firebase_admin
from firebase_admin import credentials, firestore
import os

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

if __name__ == '__main__':
    app.run(debug=True, port=5000)