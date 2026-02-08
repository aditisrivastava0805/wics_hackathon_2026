import { Timestamp } from 'firebase/firestore';

// ============ USER ============

export interface MusicPreferences {
  genres: string[];
  artists: string[];
}

export type BudgetRange = 'under40' | '40to80' | 'flexible';
export type GenderPref = 'any' | 'same';
export type ConcertVibe = 'moshPit' | 'chillBalcony' | 'indieListening';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string | null;
  spotifyConnected: boolean;
  /** Last.fm username for fetching real listening history (top artists & tags as genres). */
  lastfmUsername?: string | null;
  musicPreferences: MusicPreferences;
  budgetRange: BudgetRange;
  genderPref: GenderPref;
  concertVibes: ConcertVibe[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============ CONCERT ============

export interface Concert {
  id: string;
  name: string;
  artist: string;
  venue: string;
  date: Timestamp;
  imageUrl: string | null;
  /** Optional higher-quality artist/event image (e.g. from backend). */
  artistImageUrl?: string | null;
  genre: string;
  priceRange: string;
  createdAt: Timestamp;
}

// ============ CONCERT ROOM ============

export interface RoomMember {
  id: string;
  userId: string;
  joinedAt: Timestamp;
}

export interface RoomMessage {
  id: string;
  userId: string;
  content: string;
  createdAt: Timestamp;
}

// ============ CONNECTION ============

export type ConnectionStatus = 'pending' | 'accepted' | 'declined';

export interface Connection {
  id: string;
  concertId: string;
  requesterId: string;
  recipientId: string;
  status: ConnectionStatus;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============ THREAD ============

export interface GoingTogether {
  [userId: string]: boolean;
}

export interface Thread {
  id: string;
  concertId: string;
  connectionId: string;
  participants: [string, string];
  goingTogether: GoingTogether;
  createdAt: Timestamp;
}

export interface ThreadMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: Timestamp;
}

// ============ CHECKLIST ============

export interface ChecklistItem {
  id: string;
  title: string;
  isCompleted: boolean;
  assignedTo: string | null;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// ============ API TYPES ============

export interface ApiError {
  error: string;
  message: string;
}

export interface ApiSuccess<T> {
  data: T;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiError;
