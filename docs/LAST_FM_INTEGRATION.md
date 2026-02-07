Last.fm Integration Proposal
Overview
Last.fm provides rich listening history data through scrobbles (tracked plays). Users either:
Have an existing Last.fm account with years of data
Can create one and connect it to Spotify/Apple Music to start scrobbling
1. API Access
Getting Started (instant, no approval needed):
Create account at last.fm/api/account/create
Get API Key immediately
No OAuth required for public user data!
Key difference from Spotify: Last.fm profiles are public by default, so you can fetch any user's top artists just with their username (no tokens needed).
2. Relevant API Endpoints
Endpoint	Method	Data Returned
user.getTopArtists	GET	Top artists with play counts
user.getTopTracks	GET	Top tracks with play counts
user.getTopTags	GET	User's top genre tags
user.getRecentTracks	GET	Recently played tracks
artist.getTopTags	GET	Genre tags for an artist
user.getInfo	GET	Profile info, total scrobbles
Time periods available: 7day, 1month, 3month, 6month, 12month, overall
3. Authentication Options
Option A: Username Only (Simpler)
User enters Last.fm username → We fetch their public data → Done
User enters Last.fm username → We fetch their public data → Done
No OAuth needed
Works immediately
User must have public profile (default)
Option B: Full OAuth (More Features)
User clicks "Connect Last.fm" → OAuth flow → Get session key → Can write data too
User clicks "Connect Last.fm" → OAuth flow → Get session key → Can write data too
Required if we want to scrobble for them
More trust signals
Slightly more complex
Recommendation: Start with Option A, add OAuth later if needed.
4. Proposed Data Schema
// lib/types.ts additions

interface LastFmArtist {
  name: string;
  playcount: number;
  url: string;
  imageUrl: string | null;
}

interface LastFmTrack {
  name: string;
  artist: string;
  playcount: number;
  url: string;
}

interface LastFmProfile {
  username: string;
  connectedAt: Timestamp;
  lastSynced: Timestamp;
  
  // Profile stats
  totalScrobbles: number;
  registeredAt: string;
  
  // Top data (we'll fetch medium-term by default)
  topArtists: LastFmArtist[];      // Top 20
  topTracks: LastFmTrack[];        // Top 20
  topGenres: string[];             // Derived from artist tags
  
  // Computed for matching
  genreWeights: Record<string, number>;  // { "indie": 0.4, "rock": 0.3, ... }
  artistNames: string[];                  // Lowercase for easy comparison
}

// Update UserProfile
interface UserProfile {
  // ... existing fields ...
  lastFmConnected: boolean;
  lastFmProfile?: LastFmProfile;
}
// lib/types.ts additionsinterface LastFmArtist {  name: string;  playcount: number;  url: string;  imageUrl: string | null;}interface LastFmTrack {  name: string;  artist: string;  playcount: number;  url: string;}interface LastFmProfile {  username: string;  connectedAt: Timestamp;  lastSynced: Timestamp;    // Profile stats  totalScrobbles: number;  registeredAt: string;    // Top data (we'll fetch medium-term by default)  topArtists: LastFmArtist[];      // Top 20  topTracks: LastFmTrack[];        // Top 20  topGenres: string[];             // Derived from artist tags    // Computed for matching  genreWeights: Record<string, number>;  // { "indie": 0.4, "rock": 0.3, ... }  artistNames: string[];                  // Lowercase for easy comparison}// Update UserProfileinterface UserProfile {  // ... existing fields ...  lastFmConnected: boolean;  lastFmProfile?: LastFmProfile;}
5. Matching Algorithm Enhancement
function calculateLastFmCompatibility(
  userA: LastFmProfile, 
  userB: LastFmProfile
): { score: number; sharedArtists: string[] } {
  
  // 1. Shared artists (50% weight)
  const sharedArtists = userA.artistNames.filter(a => 
    userB.artistNames.includes(a)
  );
  const artistScore = Math.min(sharedArtists.length / 5, 1) * 50;
  
  // 2. Genre overlap using cosine similarity (40% weight)
  const genreScore = cosineSimilarity(
    userA.genreWeights, 
    userB.genreWeights
  ) * 40;
  
  // 3. Listening intensity similarity (10% weight)
  // Users who scrobble similar amounts per month
  const intensityA = userA.totalScrobbles / monthsSinceRegistered(userA);
  const intensityB = userB.totalScrobbles / monthsSinceRegistered(userB);
  const intensityScore = (1 - Math.abs(intensityA - intensityB) / 1000) * 10;
  
  return {
    score: Math.round(artistScore + genreScore + Math.max(0, intensityScore)),
    sharedArtists: sharedArtists.slice(0, 5)  // Top 5 for display
  };
}
function calculateLastFmCompatibility(  userA: LastFmProfile,   userB: LastFmProfile): { score: number; sharedArtists: string[] } {    // 1. Shared artists (50% weight)  const sharedArtists = userA.artistNames.filter(a =>     userB.artistNames.includes(a)  );  const artistScore = Math.min(sharedArtists.length / 5, 1) * 50;    // 2. Genre overlap using cosine similarity (40% weight)  const genreScore = cosineSimilarity(    userA.genreWeights,     userB.genreWeights  ) * 40;    // 3. Listening intensity similarity (10% weight)  // Users who scrobble similar amounts per month  const intensityA = userA.totalScrobbles / monthsSinceRegistered(userA);  const intensityB = userB.totalScrobbles / monthsSinceRegistered(userB);  const intensityScore = (1 - Math.abs(intensityA - intensityB) / 1000) * 10;    return {    score: Math.round(artistScore + genreScore + Math.max(0, intensityScore)),    sharedArtists: sharedArtists.slice(0, 5)  // Top 5 for display  };}
6. API Wrapper Design
// lib/lastfm/client.ts

const LASTFM_API_BASE = 'https://ws.audioscrobbler.com/2.0/';

interface LastFmClient {
  // Fetch user's top artists
  getTopArtists(username: string, period?: string, limit?: number): Promise<LastFmArtist[]>;
  
  // Fetch user's top tracks  
  getTopTracks(username: string, period?: string, limit?: number): Promise<LastFmTrack[]>;
  
  // Fetch user profile info
  getUserInfo(username: string): Promise<{ totalScrobbles: number; registeredAt: string }>;
  
  // Get genre tags for an artist
  getArtistTags(artistName: string): Promise<string[]>;
  
  // Validate username exists
  validateUsername(username: string): Promise<boolean>;
}
// lib/lastfm/client.tsconst LASTFM_API_BASE = 'https://ws.audioscrobbler.com/2.0/';interface LastFmClient {  // Fetch user's top artists  getTopArtists(username: string, period?: string, limit?: number): Promise<LastFmArtist[]>;    // Fetch user's top tracks    getTopTracks(username: string, period?: string, limit?: number): Promise<LastFmTrack[]>;    // Fetch user profile info  getUserInfo(username: string): Promise<{ totalScrobbles: number; registeredAt: string }>;    // Get genre tags for an artist  getArtistTags(artistName: string): Promise<string[]>;    // Validate username exists  validateUsername(username: string): Promise<boolean>;}
7. UI Components
Connect Flow:
┌─────────────────────────────────────────┐
│  🎵 Connect Last.fm                     │
│                                         │
│  Enter your Last.fm username:           │
│  ┌─────────────────────────────────┐   │
│  │ your_username                    │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Don't have Last.fm?                    │
│  Create free account →                  │
│                                         │
│  [Cancel]              [Connect]        │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐│  🎵 Connect Last.fm                     ││                                         ││  Enter your Last.fm username:           ││  ┌─────────────────────────────────┐   ││  │ your_username                    │   ││  └─────────────────────────────────┘   ││                                         ││  Don't have Last.fm?                    ││  Create free account →                  ││                                         ││  [Cancel]              [Connect]        │└─────────────────────────────────────────┘
Profile Display:
┌─────────────────────────────────────────┐
│  🎧 Music Taste (via Last.fm)           │
│                                         │
│  12,453 scrobbles since 2019            │
│                                         │
│  Top Artists:                           │
│  1. Arctic Monkeys (324 plays)          │
│  2. The Strokes (287 plays)             │
│  3. Tame Impala (201 plays)             │
│                                         │
│  Top Genres: indie, rock, alternative   │
│                                         │
│  [Refresh Data]  [Disconnect]           │
└─────────────────────────────────────────┘
┌─────────────────────────────────────────┐│  🎧 Music Taste (via Last.fm)           ││                                         ││  12,453 scrobbles since 2019            ││                                         ││  Top Artists:                           ││  1. Arctic Monkeys (324 plays)          ││  2. The Strokes (287 plays)             ││  3. Tame Impala (201 plays)             ││                                         ││  Top Genres: indie, rock, alternative   ││                                         ││  [Refresh Data]  [Disconnect]           │└─────────────────────────────────────────┘
Member Card Enhancement:
┌─────────────────────────────────────┐
│ 👤 Sarah M.              78% match  │
│    indie, rock                      │
│    🎵 3 artists in common           │
│       Arctic Monkeys, The 1975...   │
└─────────────────────────────────────┘
┌─────────────────────────────────────┐│ 👤 Sarah M.              78% match  ││    indie, rock                      ││    🎵 3 artists in common           ││       Arctic Monkeys, The 1975...   │└─────────────────────────────────────┘
8. Files to Create/Modify
File	Action	Purpose
.env.local	Modify	Add LASTFM_API_KEY
lib/types.ts	Modify	Add Last.fm types
lib/lastfm/client.ts	NEW	API wrapper
lib/lastfm/utils.ts	NEW	Genre extraction helpers
app/api/lastfm/connect/route.ts	NEW	Validate & fetch user data
app/api/lastfm/sync/route.ts	NEW	Refresh user's data
lib/matching.ts	Modify	Add Last.fm compatibility
lib/firebase/firestore.ts	Modify	Add Last.fm data functions
components/lastfm/ConnectModal.tsx	NEW	Username input modal
components/lastfm/ProfileCard.tsx	NEW	Display listening stats
app/(main)/profile/page.tsx	Modify	Add connect section
components/room/MemberCard.tsx	Modify	Show shared artists
9. Step-by-Step Implementation Plan
Setup - Get API key, add to env
API Client - Create Last.fm wrapper with rate limiting
Connect Flow - Username input → validate → fetch data → store
Data Processing - Extract genres, compute weights
Matching Update - Integrate Last.fm scores
Profile UI - Show connected state and stats
Member Cards - Display shared artists badge
10. Advantages Over Spotify
Aspect	Last.fm	Spotify
Setup time	5 minutes	1-2 days (app review)
Auth complexity	Username only	Full OAuth
Historical data	Years of scrobbles	Recent only
Play counts	Exact numbers	Not available
API limits	5 req/sec	Stricter
User base	Smaller but dedicated	Larger
