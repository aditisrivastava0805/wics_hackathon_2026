import type { UserProfile, Concert, BudgetRange } from '@/lib/types';

export function calculateConcertMatchScore(
  user: UserProfile,
  concert: Concert
): number {
  let score = 50;

  const userGenres = user.musicPreferences.genres.map((g) => g.toLowerCase());
  const concertGenre = concert.genre.toLowerCase();

  if (userGenres.includes(concertGenre)) {
    score += 30;
  } else if (userGenres.some((g) => concertGenre.includes(g) || g.includes(concertGenre))) {
    score += 15;
  }

  const userArtists = user.musicPreferences.artists.map((a) => a.toLowerCase());
  const concertArtist = concert.artist.toLowerCase();

  if (userArtists.includes(concertArtist)) {
    score += 20;
  } else if (userArtists.some((a) => concertArtist.includes(a) || a.includes(concertArtist))) {
    score += 10;
  }

  return Math.min(100, Math.max(0, score));
}

export function calculateUserCompatibility(
  user1: UserProfile,
  user2: UserProfile
): number {
  let score = 0;
  let factors = 0;

  const genreOverlap = calculateArrayOverlap(
    user1.musicPreferences.genres,
    user2.musicPreferences.genres
  );
  score += genreOverlap * 30;
  factors += 30;

  const artistOverlap = calculateArrayOverlap(
    user1.musicPreferences.artists,
    user2.musicPreferences.artists
  );
  score += artistOverlap * 25;
  factors += 25;

  const budgetScore = calculateBudgetAlignment(user1.budgetRange, user2.budgetRange);
  score += budgetScore * 20;
  factors += 20;

  const vibeOverlap = calculateArrayOverlap(user1.concertVibes, user2.concertVibes);
  score += vibeOverlap * 25;
  factors += 25;

  return Math.round((score / factors) * 100);
}

function calculateArrayOverlap(arr1: string[], arr2: string[]): number {
  if (arr1.length === 0 || arr2.length === 0) return 0.5;

  const set1 = new Set(arr1.map((s) => s.toLowerCase()));
  const set2 = new Set(arr2.map((s) => s.toLowerCase()));

  let overlap = 0;
  set1.forEach((item) => {
    if (set2.has(item)) overlap++;
  });

  const totalUnique = new Set([...set1, ...set2]).size;
  return overlap / totalUnique;
}

function calculateBudgetAlignment(budget1: BudgetRange, budget2: BudgetRange): number {
  if (budget1 === budget2) return 1;
  if (budget1 === 'flexible' || budget2 === 'flexible') return 0.8;

  const budgetOrder: BudgetRange[] = ['under40', '40to80', 'flexible'];
  const idx1 = budgetOrder.indexOf(budget1);
  const idx2 = budgetOrder.indexOf(budget2);

  return Math.abs(idx1 - idx2) === 1 ? 0.5 : 0.2;
}

export function sortConcertsByPreference(
  concerts: Concert[],
  user: UserProfile
): Concert[] {
  return [...concerts].sort((a, b) => {
    const scoreA = calculateConcertMatchScore(user, a);
    const scoreB = calculateConcertMatchScore(user, b);
    return scoreB - scoreA;
  });
}

export function sortUsersByCompatibility(
  users: UserProfile[],
  currentUser: UserProfile
): UserProfile[] {
  return [...users].sort((a, b) => {
    const scoreA = calculateUserCompatibility(currentUser, a);
    const scoreB = calculateUserCompatibility(currentUser, b);
    return scoreB - scoreA;
  });
}
