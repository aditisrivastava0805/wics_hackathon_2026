# Encore - UT Concert Matching

Encore is a concert-first social platform that helps UT Austin students connect one-on-one with compatible people for specific concerts.

## Features

- **UT Email Authentication**: Only @utexas.edu emails allowed
- **Concert Discovery**: Browse upcoming Austin concerts sorted by your music preferences
- **Concert Rooms**: Join rooms for specific concerts, see other interested attendees
- **Room Chat**: Public chat with everyone in the concert room
- **1:1 Connections**: Request private connections with other users
- **Private Threads**: Concert-scoped private messaging after connection accepted
- **Going Together**: Mutual confirmation with confetti celebration
- **Coordination Checklist**: Shared checklist for concert logistics

## Tech Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript
- **Backend**: Firebase (Auth + Firestore)
- **Styling**: Tailwind CSS
- **Real-time**: Firestore listeners

## Getting Started

### Prerequisites

- Node.js 18+
- Firebase project with Firestore and Authentication enabled

### 1. Clone and Install

```bash
git clone <repo-url>
cd wics_hackathon_2026
cd frontend
npm install
```

### 2. Firebase Setup

1. Create a new Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication** with Email/Password provider
3. Enable **Cloud Firestore** database
4. Get your Firebase config from Project Settings > General > Your apps
5. Generate a service account key from Project Settings > Service Accounts

### 3. Environment Variables

Copy the example env file and fill in your Firebase credentials:

```bash
cd frontend
cp .env.local.example .env.local
```

Edit `.env.local` with your Firebase config:

```env
# Firebase Client SDK (from Firebase Console > Project Settings > General)
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Firebase Admin SDK (from Firebase Console > Project Settings > Service Accounts)
FIREBASE_ADMIN_PROJECT_ID=your_project_id
FIREBASE_ADMIN_CLIENT_EMAIL=your_service_account_email
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

### 4. Seed Data

From the `frontend` folder, seed the database with mock concerts:

```bash
cd frontend
npm run seed
```

To clear and reseed:

```bash
npm run seed -- --clear
```

### 5. Run Development Server

From the `frontend` folder:

```bash
cd frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── frontend/            # Next.js app
│   ├── app/
│   │   ├── (auth)/      # Login, Signup, Onboarding pages
│   │   ├── (main)/      # Authenticated pages (concerts, threads, etc.)
│   │   ├── api/         # API route handlers
│   │   ├── layout.tsx   # Root layout
│   │   └── page.tsx     # Landing page
│   ├── components/
│   │   └── ui/          # Reusable UI components
│   ├── context/
│   │   └── auth-context.tsx
│   ├── hooks/
│   ├── lib/
│   │   ├── firebase/    # Firebase config and helpers
│   │   ├── types.ts
│   │   ├── utils.ts
│   │   └── matching.ts
│   ├── scripts/
│   │   └── seed.ts
│   └── middleware.ts
├── backend/             # Flask API (events, matching, rooms)
└── docs/
```

## Firebase Security Rules

Add these Firestore security rules for proper access control:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read/write their own profile
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId;
    }
    
    // Concerts are readable by authenticated users
    match /concerts/{concertId} {
      allow read: if request.auth != null;
      
      // Room members
      match /members/{memberId} {
        allow read: if request.auth != null;
        allow write: if request.auth.uid == memberId;
      }
      
      // Room messages
      match /messages/{messageId} {
        allow read: if request.auth != null;
        allow create: if request.auth != null;
      }
    }
    
    // Connections
    match /connections/{connectionId} {
      allow read: if request.auth != null && 
        (resource.data.requesterId == request.auth.uid || 
         resource.data.recipientId == request.auth.uid);
      allow create: if request.auth != null;
      allow update: if request.auth.uid == resource.data.recipientId;
    }
    
    // Threads
    match /threads/{threadId} {
      allow read, write: if request.auth != null && 
        request.auth.uid in resource.data.participants;
      
      match /messages/{messageId} {
        allow read, write: if request.auth != null;
      }
      
      match /checklist/{itemId} {
        allow read, write: if request.auth != null;
      }
    }
  }
}
```

## API Routes

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/concerts` | List all concerts |
| GET | `/api/concerts/[id]` | Get concert details |
| POST | `/api/concerts/[id]/join` | Join concert room |
| GET/POST | `/api/concerts/[id]/messages` | Room messages |
| GET/POST | `/api/connections` | User connections |
| PATCH | `/api/connections/[id]` | Accept/decline connection |
| GET | `/api/threads/[id]` | Get thread details |
| GET/POST | `/api/threads/[id]/messages` | Private messages |
| PATCH | `/api/threads/[id]/going-together` | Update going-together |
| GET/POST | `/api/threads/[id]/checklist` | Checklist items |
| PATCH/DELETE | `/api/threads/[id]/checklist/[itemId]` | Update/delete item |

## Next Steps

See `docs/CURSOR_BUILD_BRIEF.md` for the full development roadmap.

## License

MIT
