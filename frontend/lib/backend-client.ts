/**
 * Client for backend (Flask) APIs via Next.js proxy.
 * All calls go to /api/* which proxy to BACKEND_URL.
 */

import type { Concert } from '@/lib/types';

/** Convert backend event date string to a Timestamp-like object for formatDate() */
function toTimestampLike(dateStr: string | null | undefined): { toDate: () => Date } | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : { toDate: () => d };
}

/** Map BackendEvent to frontend Concert type */
export function eventToConcert(e: BackendEvent): Concert {
  return {
    id: e.id,
    name: e.name,
    artist: e.name,
    venue: e.venue,
    date: toTimestampLike(e.date) as any,
    imageUrl: e.imageUrl ?? null,
    genre: '',
    priceRange: e.priceRange ?? 'See tickets',
    createdAt: toTimestampLike(new Date().toISOString()) as any,
  };
}

// --- Events (concerts list from SerpAPI) ---
export interface BackendEvent {
  id: string;
  name: string;
  venue: string;
  date: string;
  imageUrl: string | null;
  priceRange: string;
  link?: string;
  description?: string;
}

export async function fetchEvents(options?: {
  musicOnly?: boolean;
  max?: number;
}): Promise<BackendEvent[]> {
  const musicOnly = options?.musicOnly ?? true;
  const max = options?.max ?? 50;
  const res = await fetch(
    `/api/events?music_only=${musicOnly}&max=${max}`,
    { next: { revalidate: 300 } }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { error?: string }).error || 'Failed to fetch events');
  }
  const data = await res.json();
  return (data.data ?? []) as BackendEvent[];
}

// --- Register ---
export async function registerUser(body: {
  email: string;
  name?: string;
  music_preferences?: { artists: string[]; genres: string[] };
  budget?: string;
  concert_vibes?: string[];
  profile_image?: string;
}): Promise<{ success: boolean; verified: boolean; message: string }> {
  const res = await fetch('/api/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Registration failed');
  return data;
}

// --- Match ---
export interface MatchResult {
  email: string;
  name: string;
  score: number;
  common_artists: string[];
  budget?: string;
  verified: boolean;
}

export async function fetchMatches(userEmail: string, concertId?: string): Promise<MatchResult[]> {
  const res = await fetch('/api/match', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user_email: userEmail, concert_id: concertId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to get matches');
  return (data.matches ?? []) as MatchResult[];
}

// --- Sync Last.fm ---
export async function syncLastFm(
  email: string,
  lastfmUsername: string
): Promise<{ success: boolean; message: string; data?: unknown }> {
  const res = await fetch('/api/sync-lastfm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, lastfm_username: lastfmUsername }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Sync failed');
  return data;
}

// --- Rooms ---
export async function joinRoom(
  userEmail: string,
  concertId: string,
  concertName: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/rooms/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_email: userEmail,
      concert_id: concertId,
      concert_name: concertName,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to join room');
  return data;
}

export interface RoomPerson {
  email: string;
  name: string;
  score: number;
  avatar?: string;
  common_artists: string[];
  verified: boolean;
}

export async function checkRoomJoined(
  concertId: string,
  userEmail: string
): Promise<boolean> {
  const res = await fetch(
    `/api/rooms/joined?concert_id=${encodeURIComponent(concertId)}&user_email=${encodeURIComponent(userEmail)}`
  );
  const data = await res.json();
  return (data as { joined?: boolean }).joined === true;
}

export async function fetchRoomPeople(
  concertId: string,
  userEmail: string
): Promise<RoomPerson[]> {
  const res = await fetch(
    `/api/rooms/people?concert_id=${encodeURIComponent(concertId)}&user_email=${encodeURIComponent(userEmail)}`
  );
  const data = await res.json();
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to fetch people');
  return (data.people ?? []) as RoomPerson[];
}

// --- Room chat ---
export interface BackendChatMessage {
  user_email: string;
  user_name: string;
  avatar?: string;
  content: string;
  timestamp?: { _seconds?: number } | string;
}

export async function fetchRoomMessages(concertId: string): Promise<BackendChatMessage[]> {
  const res = await fetch(
    `/api/rooms/chat?concert_id=${encodeURIComponent(concertId)}`
  );
  const data = await res.json();
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to fetch messages');
  return (data.messages ?? []) as BackendChatMessage[];
}

export async function sendRoomMessage(
  concertId: string,
  userEmail: string,
  content: string
): Promise<void> {
  const res = await fetch('/api/rooms/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      concert_id: concertId,
      user_email: userEmail,
      content: content.trim(),
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Failed to send message');
}

// --- Connections ---
export async function requestConnection(
  requesterEmail: string,
  recipientEmail: string,
  concertId: string
): Promise<{ success?: boolean; message: string; connection_id?: string; status?: string }> {
  const res = await fetch('/api/connect/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requester_email: requesterEmail,
      recipient_email: recipientEmail,
      concert_id: concertId,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Request failed');
  return data;
}

export async function acceptConnection(
  connectionId: string
): Promise<{ success: boolean; message: string }> {
  const res = await fetch('/api/connect/accept', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ connection_id: connectionId }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error((data as { error?: string }).error || 'Accept failed');
  return data;
}

export interface ConnectionStatusResponse {
  status: 'none' | 'pending' | 'accepted';
  connection_id?: string;
  requester?: string;
  recipient?: string;
  concert_id?: string;
}

export async function getConnectionStatus(
  requesterEmail: string,
  recipientEmail: string,
  concertId?: string
): Promise<ConnectionStatusResponse> {
  const params = new URLSearchParams({
    requester: requesterEmail,
    recipient: recipientEmail,
  });
  if (concertId) params.set('concert_id', concertId);
  const res = await fetch(`/api/connect/status?${params.toString()}`);
  const data = await res.json();
  return data as ConnectionStatusResponse;
}
