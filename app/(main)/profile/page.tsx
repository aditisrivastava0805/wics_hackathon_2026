'use client';

import { useState } from 'react';
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

export default function ProfilePage() {
  const { user, userProfile, refreshProfile } = useAuth();
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const [displayName, setDisplayName] = useState(userProfile?.displayName || '');
  const [bio, setBio] = useState(userProfile?.bio || '');
  const [selectedGenres, setSelectedGenres] = useState<string[]>(
    userProfile?.musicPreferences?.genres || []
  );
  const [favoriteArtists, setFavoriteArtists] = useState(
    userProfile?.musicPreferences?.artists?.join(', ') || ''
  );
  const [budgetRange, setBudgetRange] = useState<BudgetRange>(
    userProfile?.budgetRange || 'flexible'
  );
  const [genderPref, setGenderPref] = useState<GenderPref>(
    userProfile?.genderPref || 'any'
  );
  const [concertVibes, setConcertVibes] = useState<ConcertVibe[]>(
    userProfile?.concertVibes || []
  );

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

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setSuccess(false);

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        displayName,
        bio: bio || null,
        musicPreferences: {
          genres: selectedGenres,
          artists: favoriteArtists.split(',').map((a) => a.trim()).filter(Boolean),
        },
        budgetRange,
        genderPref,
        concertVibes,
        updatedAt: serverTimestamp(),
      });
      
      await refreshProfile();
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save profile:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!userProfile) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Profile</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Basic Info */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Basic Info</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={userProfile.email}
                disabled
                className="w-full px-4 py-2 border border-gray-200 rounded-lg bg-gray-50 text-gray-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="Tell others about yourself..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Music Preferences */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Music Preferences</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Favorite Genres
              </label>
              <div className="flex flex-wrap gap-2">
                {GENRES.map((genre) => (
                  <button
                    key={genre}
                    type="button"
                    onClick={() => toggleGenre(genre)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedGenres.includes(genre)
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {genre}
                  </button>
                ))}
              </div>
            </div>

            <div>
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
          </div>
        </div>

        {/* Concert Preferences */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Concert Preferences</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Budget Range
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: 'under40', label: 'Under $40' },
                  { value: '40to80', label: '$40 - $80' },
                  { value: 'flexible', label: 'Flexible' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setBudgetRange(option.value as BudgetRange)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      budgetRange === option.value
                        ? 'bg-primary-100 border-2 border-primary-500 text-primary-700'
                        : 'bg-gray-50 border-2 border-transparent text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Matching Preference
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'any', label: 'Any gender' },
                  { value: 'same', label: 'Same gender only' },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setGenderPref(option.value as GenderPref)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      genderPref === option.value
                        ? 'bg-primary-100 border-2 border-primary-500 text-primary-700'
                        : 'bg-gray-50 border-2 border-transparent text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Concert Vibes
              </label>
              <div className="space-y-2">
                {VIBES.map((vibe) => (
                  <button
                    key={vibe.value}
                    type="button"
                    onClick={() => toggleVibe(vibe.value)}
                    className={`w-full px-4 py-2 rounded-lg text-left text-sm font-medium transition-colors ${
                      concertVibes.includes(vibe.value)
                        ? 'bg-primary-100 border-2 border-primary-500 text-primary-700'
                        : 'bg-gray-50 border-2 border-transparent text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {vibe.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-4 border-t border-gray-200">
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-600 rounded-lg text-sm">
              Profile saved successfully!
            </div>
          )}
          
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}
