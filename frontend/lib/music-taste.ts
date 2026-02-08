import type { MusicPreferences, UserProfile } from './types';

const LASTFM_API_BASE = 'https://ws.audioscrobbler.com/2.0/';

// Ensure API key is only used on the server for security
function getLastfmApiKey(): string | undefined {
  return process.env.LASTFM_API_KEY;
}

interface LastFmTopArtistsResponse {
  topartists?: { artist?: Array<{ name: string }> };
  error?: number;
}

interface LastFmTopTagsResponse {
  toptags?: { tag?: Array<{ name: string }> };
  error?: number;
}

/**
 * Fetch music taste from Last.fm with error boundaries and caching.
 */
export async function fetchLastfmMusicTaste(
  username: string,
  options?: { limitArtists?: number; limitTags?: number }
): Promise<MusicPreferences | null> {
  const apiKey = getLastfmApiKey();
  if (!apiKey?.trim()) {
    console.error("Missing LASTFM_API_KEY in environment variables.");
    return null;
  }

  const limitArtists = options?.limitArtists ?? 30;
  const limitTags = options?.limitTags ?? 20;

  const getUrl = (method: string, extra: Record<string, string>) => {
    const params = new URLSearchParams({
      method,
      user: username.trim(),
      api_key: apiKey,
      format: 'json',
      ...extra,
    });
    return `${LASTFM_API_BASE}?${params.toString()}`;
  };

  try {
    // We use allSettled so if tags fail, we still get artists (and vice versa)
    const [artistsResult, tagsResult] = await Promise.allSettled([
      fetch(getUrl('user.getTopArtists', { limit: String(limitArtists) }), {
        next: { revalidate: 3600 }, // Cache for 1 hour
      }).then(res => res.json()),
      fetch(getUrl('user.getTopTags', { limit: String(limitTags) }), {
        next: { revalidate: 3600 }, 
      }).then(res => res.json()),
    ]);

    const artists: string[] = [];
    const genres: string[] = [];

    if (artistsResult.status === 'fulfilled' && !artistsResult.value.error) {
      const list = artistsResult.value.topartists?.artist;
      if (Array.isArray(list)) {
        list.forEach(a => a.name && artists.push(a.name.trim()));
      }
    }

    if (tagsResult.status === 'fulfilled' && !tagsResult.value.error) {
      const list = tagsResult.value.toptags?.tag;
      if (Array.isArray(list)) {
        list.forEach(t => t.name && genres.push(t.name.trim()));
      }
    }

    return { artists, genres };
  } catch (error) {
    console.error("Last.fm Fetch Error:", error);
    return null;
  }
}

/**
 * Get user music taste. Falls back to empty arrays if no Last.fm account.
 */
export async function get_user_music_taste(
  userId: string | null | undefined,
  userProfile?: UserProfile | null
): Promise<MusicPreferences> {
  const username = userProfile?.lastfmUsername;

  if (username?.trim()) {
    const taste = await fetchLastfmMusicTaste(username.trim());
    if (taste) return taste;
  }

  // Return empty structure instead of mock data
  return { genres: [], artists: [] };
}

/**
 * Final logic: Priority is manual profile edits > Last.fm > Empty State.
 */
export async function get_user_music_taste_or_empty(
  userProfile: UserProfile | null | undefined
): Promise<MusicPreferences> {
  if (!userProfile) return { genres: [], artists: [] };

  const existing = userProfile.musicPreferences;
  
  // If user has manually saved preferences, use those
  if (existing?.genres?.length || existing?.artists?.length) {
    return {
      genres: existing.genres ?? [],
      artists: existing.artists ?? [],
    };
  }

  // Otherwise, pull fresh from Last.fm
  return await get_user_music_taste(userProfile.id, userProfile);
}