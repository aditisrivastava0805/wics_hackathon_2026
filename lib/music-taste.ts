import type { MusicPreferences, UserProfile } from './types';

/**
 * Get the current user's music taste (genres + artists).
 * When Spotify OAuth is implemented, this will call the Spotify API for real data.
 * Until then, returns robust mock data so the rest of the team isn't blocked.
 */

const MOCK_GENRES = [
  'Pop',
  'Indie',
  'Rock',
  'Hip-Hop',
  'R&B',
  'Country',
  'Electronic',
  'Jazz',
  'Folk',
  'Latin',
  'Alternative',
  'Soul',
  'Metal',
  'Blues',
] as const;

const MOCK_ARTISTS = [
  'Taylor Swift',
  'Phoebe Bridgers',
  'Kendrick Lamar',
  'SZA',
  'Bad Bunny',
  'ODESZA',
  'Foo Fighters',
  'Morgan Wallen',
  'John Mayer',
  'Kamasi Washington',
  'Billie Eilish',
  'Olivia Rodrigo',
  'The 1975',
  'Boygenius',
  'Mitski',
  'Lana Del Rey',
  'Tyler, the Creator',
  'Beyoncé',
  'Harry Styles',
  'Lorde',
] as const;

/**
 * Simple deterministic "hash" from a string to a number in [0, 1).
 * Same userId always yields same mock profile.
 */
function hashUserId(userId: string): number {
  let h = 0;
  for (let i = 0; i < userId.length; i++) {
    h = (h << 5) - h + userId.charCodeAt(i);
    h = h & 0x7fff_ffff;
  }
  return Math.abs(h) / 0x8000_0000;
}

/**
 * Seeded random in [0, 1).
 */
function nextSeed(seed: number): number {
  const s = (seed * 9301 + 49297) % 233280;
  return s / 233280;
}

/**
 * Pick n unique items from array in a deterministic way based on seed (0..1).
 */
function pickN<T>(arr: readonly T[], n: number, seed: number): T[] {
  if (n >= arr.length) return [...arr];
  const indices = arr.map((_, i) => i);
  let s = seed;
  for (let i = 0; i < n; i++) {
    s = nextSeed(s);
    const swap = i + Math.floor(s * (indices.length - i));
    [indices[i], indices[swap]] = [indices[swap], indices[i]];
  }
  return indices.slice(0, n).map((i) => arr[i]);
}

/**
 * Returns music preferences for the user.
 * - If user has spotifyConnected and we have real Spotify data, that would be returned (future).
 * - Otherwise returns deterministic mock data based on userId so the same user gets consistent taste.
 * - If no userId is provided (e.g. anonymous), returns a default mock set.
 */
export function get_user_music_taste(
  userId: string | null | undefined,
  userProfile?: UserProfile | null
): MusicPreferences {
  // Future: if (userProfile?.spotifyConnected) return fetchSpotifyMusicTaste(userId);
  const seed = userId ? hashUserId(userId) : 0.5;
  const numGenres = 3 + Math.floor(seed * 4); // 3–6 genres
  const numArtists = 4 + Math.floor(seed * 7); // 4–10 artists
  const genres = pickN(MOCK_GENRES, numGenres, seed);
  const artists = pickN(MOCK_ARTISTS, numArtists, seed + 0.31);
  return { genres, artists };
}

/**
 * Optional: get mock music taste for a user and merge with existing profile preferences.
 * Use when you want to "fill in" empty musicPreferences from the profile with mock data.
 */
export function get_user_music_taste_or_mock(
  userProfile: UserProfile | null | undefined
): MusicPreferences {
  if (!userProfile) {
    return get_user_music_taste(null);
  }
  const existing = userProfile.musicPreferences;
  const hasGenres = existing?.genres?.length;
  const hasArtists = existing?.artists?.length;
  if (hasGenres && hasArtists) {
    return {
      genres: existing.genres,
      artists: existing.artists,
    };
  }
  const mock = get_user_music_taste(userProfile.id, userProfile);
  return {
    genres: hasGenres ? existing!.genres : mock.genres,
    artists: hasArtists ? existing!.artists : mock.artists,
  };
}
