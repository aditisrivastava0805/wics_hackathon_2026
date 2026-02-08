'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/context/auth-context';
import type { BudgetRange, GenderPref, ConcertVibe } from '@/lib/types';

const GENRES = ['Pop', 'Rock', 'Hip-Hop', 'R&B', 'Country', 'Electronic', 'Indie', 'Jazz', 'Classical', 'Latin'];
const VIBES: { value: ConcertVibe; label: string }[] = [
  { value: 'moshPit', label: 'Mosh Pit Energy' },
  { value: 'chillBalcony', label: 'Chill Balcony Vibes' },
  { value: 'indieListening', label: 'Indie Listening Experience' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [favoriteArtists, setFavoriteArtists] = useState('');
  const [budgetRange, setBudgetRange] = useState<BudgetRange>('flexible');
  const [genderPref, setGenderPref] = useState<GenderPref>('any');
  const [concertVibes, setConcertVibes] = useState<ConcertVibe[]>([]);

  const toggleGenre = (genre: string) => {
    setSelectedGenres((prev) =>
      prev.includes(genre) ? prev.filter((g) => g !== genre) : [...prev, genre]
    );
  };

  const toggleVibe = (vibe: ConcertVibe) => {
    setConcertVibes((prev) =>
      prev.includes(vibe) ? prev.filter((v) => v !== vibe) : [...prev, vibe]
    );
  };

  const handleComplete = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      const musicPrefs = {
        genres: selectedGenres,
        artists: favoriteArtists.split(',').map((a) => a.trim()).filter(Boolean),
      };
      await updateDoc(userRef, {
        musicPreferences: musicPrefs,
        budgetRange,
        genderPref,
        concertVibes,
        updatedAt: serverTimestamp(),
      });
      // Sync to backend (Flask) so room/connection features work
      try {
        const { registerUser } = await import('@/lib/backend-client');
        await registerUser({
          email: user.email!,
          name: user.displayName ?? user.email?.split('@')[0],
          music_preferences: musicPrefs,
          budget,
          concert_vibes: concertVibes,
        });
      } catch {
        // Backend may be unavailable; Firestore profile is saved
      }
      router.push('/concerts');
    } catch (err) {
      console.error('Failed to save preferences:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-8 bg-gradient-to-br from-primary-50 to-accent-50">
      <div className="w-full max-w-lg bg-white rounded-xl shadow-lg p-8">
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-1/3 h-1 rounded-full mx-1 ${
                  s <= step ? 'bg-primary-500' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-500 text-center">Step {step} of 3</p>
        </div>

        {step === 1 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">What music do you love?</h2>
            <p className="text-gray-600 mb-4">Select your favorite genres</p>
            <div className="flex flex-wrap gap-2 mb-6">
              {GENRES.map((genre) => (
                <button
                  key={genre}
                  onClick={() => toggleGenre(genre)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedGenres.includes(genre)
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {genre}
                </button>
              ))}
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Favorite Artists (comma separated)
              </label>
              <input
                type="text"
                value={favoriteArtists}
                onChange={(e) => setFavoriteArtists(e.target.value)}
                placeholder="Taylor Swift, Kendrick Lamar, ..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <button
              onClick={() => setStep(2)}
              className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
            >
              Next
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Your concert preferences</h2>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Budget Range</label>
              <div className="space-y-2">
                {[
                  { value: 'under40', label: 'Under $40' },
                  { value: '40to80', label: '$40 - $80' },
                  { value: 'flexible', label: 'Flexible' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setBudgetRange(option.value as BudgetRange)}
                    className={`w-full px-4 py-3 rounded-lg text-left transition-colors ${
                      budgetRange === option.value
                        ? 'bg-primary-100 border-2 border-primary-500'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Who would you like to match with?
              </label>
              <div className="space-y-2">
                {[
                  { value: 'any', label: 'Any gender' },
                  { value: 'same', label: 'Same gender only' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setGenderPref(option.value as GenderPref)}
                    className={`w-full px-4 py-3 rounded-lg text-left transition-colors ${
                      genderPref === option.value
                        ? 'bg-primary-100 border-2 border-primary-500'
                        : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">What&apos;s your concert vibe?</h2>
            <p className="text-gray-600 mb-4">Select all that apply</p>

            <div className="space-y-3 mb-6">
              {VIBES.map((vibe) => (
                <button
                  key={vibe.value}
                  onClick={() => toggleVibe(vibe.value)}
                  className={`w-full px-4 py-3 rounded-lg text-left transition-colors ${
                    concertVibes.includes(vibe.value)
                      ? 'bg-primary-100 border-2 border-primary-500'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  {vibe.label}
                </button>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleComplete}
                disabled={loading}
                className="flex-1 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving...' : 'Complete Setup'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
