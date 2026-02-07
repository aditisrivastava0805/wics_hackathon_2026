'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { updateUserProfile, ProfileUpdateData } from '@/lib/firebase/auth';
import { useToast } from '@/components/ui/toast';
import { Spinner } from '@/components/ui/spinner';
import { 
  User, 
  Mail, 
  Music, 
  DollarSign, 
  Sparkles, 
  Edit2, 
  Save,
  X,
  Plus,
  Trash2,
  Users,
  Camera
} from 'lucide-react';
import type { BudgetRange, GenderPref, ConcertVibe } from '@/lib/types';

// Avatar options (emoji-based for MVP)
const AVATAR_OPTIONS = [
  '🎸', '🎤', '🎧', '🎹', '🎺', '🎷', '🥁', '🎻',
  '🎵', '🎶', '🎼', '🎪', '🌟', '✨', '🔥', '💜'
];

// Genre options
const GENRE_OPTIONS = [
  'Pop', 'Rock', 'Hip-Hop', 'R&B', 'Country', 'EDM', 'Jazz', 
  'Classical', 'Indie', 'Alternative', 'Metal', 'Folk', 'Latin', 'K-Pop'
];

// Budget options
const BUDGET_OPTIONS: { value: BudgetRange; label: string; description: string }[] = [
  { value: 'under40', label: 'Under $40', description: 'Budget-friendly shows' },
  { value: '40to80', label: '$40 - $80', description: 'Mid-range concerts' },
  { value: 'flexible', label: 'Flexible', description: 'Any price works' },
];

// Vibe options
const VIBE_OPTIONS: { value: ConcertVibe; label: string; emoji: string; description: string }[] = [
  { value: 'moshPit', label: 'Mosh Pit', emoji: '🤘', description: 'Front row energy' },
  { value: 'chillBalcony', label: 'Chill Balcony', emoji: '🥂', description: 'Relaxed viewing' },
  { value: 'indieListening', label: 'Indie Listening', emoji: '🎧', description: 'Focused on the music' },
];

// Gender preference options
const GENDER_PREF_OPTIONS: { value: GenderPref; label: string; description: string }[] = [
  { value: 'any', label: 'Anyone', description: 'Open to connecting with everyone' },
  { value: 'same', label: 'Same gender only', description: 'Prefer matching with same gender' },
];

export default function ProfilePage() {
  const { user, userProfile, refreshProfile } = useAuth();
  const { success, error } = useToast();
  
  // Edit mode state
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form state
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [avatarEmoji, setAvatarEmoji] = useState('🎸');
  const [genres, setGenres] = useState<string[]>([]);
  const [artists, setArtists] = useState<string[]>([]);
  const [newArtist, setNewArtist] = useState('');
  const [budgetRange, setBudgetRange] = useState<BudgetRange>('flexible');
  const [genderPref, setGenderPref] = useState<GenderPref>('any');
  const [concertVibes, setConcertVibes] = useState<ConcertVibe[]>([]);
  
  // Avatar picker state
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  
  // Initialize form with current profile data
  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setBio(userProfile.bio || '');
      setAvatarEmoji(userProfile.avatarUrl || '🎸');
      setGenres(userProfile.musicPreferences?.genres || []);
      setArtists(userProfile.musicPreferences?.artists || []);
      setBudgetRange(userProfile.budgetRange || 'flexible');
      setGenderPref(userProfile.genderPref || 'any');
      setConcertVibes(userProfile.concertVibes || []);
    }
  }, [userProfile]);
  
  // Toggle genre selection
  const toggleGenre = (genre: string) => {
    setGenres(prev => 
      prev.includes(genre) 
        ? prev.filter(g => g !== genre)
        : [...prev, genre]
    );
  };
  
  // Add artist
  const addArtist = () => {
    const trimmed = newArtist.trim();
    if (trimmed && !artists.includes(trimmed)) {
      setArtists(prev => [...prev, trimmed]);
      setNewArtist('');
    }
  };
  
  // Remove artist
  const removeArtist = (artist: string) => {
    setArtists(prev => prev.filter(a => a !== artist));
  };
  
  // Toggle vibe selection
  const toggleVibe = (vibe: ConcertVibe) => {
    setConcertVibes(prev =>
      prev.includes(vibe)
        ? prev.filter(v => v !== vibe)
        : [...prev, vibe]
    );
  };
  
  // Cancel editing
  const handleCancel = () => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setBio(userProfile.bio || '');
      setAvatarEmoji(userProfile.avatarUrl || '🎸');
      setGenres(userProfile.musicPreferences?.genres || []);
      setArtists(userProfile.musicPreferences?.artists || []);
      setBudgetRange(userProfile.budgetRange || 'flexible');
      setGenderPref(userProfile.genderPref || 'any');
      setConcertVibes(userProfile.concertVibes || []);
    }
    setIsEditing(false);
    setShowAvatarPicker(false);
  };
  
  // Save profile
  const handleSave = async () => {
    if (!user) return;
    
    // Validation
    if (!displayName.trim()) {
      error('Display name is required');
      return;
    }
    
    setIsSaving(true);
    
    try {
      const updates: ProfileUpdateData = {
        displayName: displayName.trim(),
        bio: bio.trim() || null,
        avatarUrl: avatarEmoji,
        musicPreferences: {
          genres,
          artists,
        },
        budgetRange,
        genderPref,
        concertVibes,
      };
      
      await updateUserProfile(user.uid, updates);
      await refreshProfile();
      
      success('Profile updated successfully!');
      setIsEditing(false);
      setShowAvatarPicker(false);
    } catch (err) {
      console.error('Failed to update profile:', err);
      error('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Your Profile</h1>
          <p className="text-gray-500 mt-1">
            {isEditing ? 'Edit your preferences' : 'Manage your preferences and account settings'}
          </p>
        </div>
        
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Edit2 size={16} />
            Edit Profile
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <X size={16} />
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? <Spinner size="sm" className="text-white" /> : <Save size={16} />}
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        )}
      </div>

      {/* Profile Card */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        {/* Avatar and Basic Info */}
        <div className="flex items-start gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="relative">
            <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center text-4xl">
              {avatarEmoji}
            </div>
            {isEditing && (
              <button
                onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                className="absolute -bottom-1 -right-1 w-8 h-8 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-sm hover:bg-gray-50"
              >
                <Camera size={14} className="text-gray-600" />
              </button>
            )}
          </div>
          <div className="flex-1">
            {isEditing ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Display Name *
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    maxLength={50}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bio
                  </label>
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell others about yourself..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
                    rows={2}
                    maxLength={200}
                  />
                  <p className="text-xs text-gray-400 mt-1">{bio.length}/200 characters</p>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-semibold text-gray-900">
                  {userProfile?.displayName || 'User'}
                </h2>
                <p className="text-gray-500 flex items-center gap-1 mt-1">
                  <Mail size={14} />
                  {user?.email}
                </p>
                {userProfile?.bio && (
                  <p className="text-gray-600 mt-2 text-sm">{userProfile.bio}</p>
                )}
              </>
            )}
          </div>
        </div>
        
        {/* Avatar Picker */}
        {isEditing && showAvatarPicker && (
          <div className="mb-6 pb-6 border-b border-gray-100">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Choose Your Avatar
            </label>
            <div className="grid grid-cols-8 gap-2">
              {AVATAR_OPTIONS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => setAvatarEmoji(emoji)}
                  className={`w-10 h-10 text-2xl rounded-lg flex items-center justify-center transition-all ${
                    avatarEmoji === emoji
                      ? 'bg-primary-100 ring-2 ring-primary-500'
                      : 'bg-gray-50 hover:bg-gray-100'
                  }`}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Music Preferences */}
        <div className="mb-6 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Music size={18} className="text-primary-600" />
            <span className="font-semibold text-gray-900">Music Preferences</span>
          </div>
          
          {isEditing ? (
            <div className="space-y-4">
              {/* Genres */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Favorite Genres
                </label>
                <div className="flex flex-wrap gap-2">
                  {GENRE_OPTIONS.map((genre) => (
                    <button
                      key={genre}
                      onClick={() => toggleGenre(genre)}
                      className={`px-3 py-1.5 text-sm rounded-full transition-all ${
                        genres.includes(genre)
                          ? 'bg-primary-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {genre}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Artists */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Favorite Artists
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={newArtist}
                    onChange={(e) => setNewArtist(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addArtist())}
                    placeholder="Add an artist..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                  <button
                    onClick={addArtist}
                    disabled={!newArtist.trim()}
                    className="px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Plus size={18} />
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {artists.map((artist) => (
                    <span
                      key={artist}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-primary-50 text-primary-700 rounded-full text-sm"
                    >
                      {artist}
                      <button
                        onClick={() => removeArtist(artist)}
                        className="hover:text-primary-900"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                  {artists.length === 0 && (
                    <span className="text-sm text-gray-400">No artists added yet</span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-sm text-gray-600 space-y-2">
              <p>
                <span className="text-gray-500">Genres:</span>{' '}
                {userProfile?.musicPreferences?.genres?.length 
                  ? userProfile.musicPreferences.genres.join(', ') 
                  : 'Not set'}
              </p>
              <p>
                <span className="text-gray-500">Artists:</span>{' '}
                {userProfile?.musicPreferences?.artists?.length 
                  ? userProfile.musicPreferences.artists.join(', ') 
                  : 'Not set'}
              </p>
            </div>
          )}
        </div>

        {/* Budget Range */}
        <div className="mb-6 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign size={18} className="text-green-600" />
            <span className="font-semibold text-gray-900">Budget Range</span>
          </div>
          
          {isEditing ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {BUDGET_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setBudgetRange(option.value)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    budgetRange === option.value
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{option.label}</div>
                  <div className="text-xs text-gray-500">{option.description}</div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              {userProfile?.budgetRange === 'under40' && 'Under $40'}
              {userProfile?.budgetRange === '40to80' && '$40 - $80'}
              {userProfile?.budgetRange === 'flexible' && 'Flexible'}
              {!userProfile?.budgetRange && 'Not set'}
            </p>
          )}
        </div>

        {/* Concert Vibes */}
        <div className="mb-6 pb-6 border-b border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={18} className="text-purple-600" />
            <span className="font-semibold text-gray-900">Concert Vibes</span>
          </div>
          
          {isEditing ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {VIBE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => toggleVibe(option.value)}
                  className={`p-3 rounded-lg border-2 text-left transition-all ${
                    concertVibes.includes(option.value)
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{option.emoji}</span>
                    <span className="font-medium text-gray-900">{option.label}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              {userProfile?.concertVibes?.length
                ? userProfile.concertVibes.map((v) => {
                    const option = VIBE_OPTIONS.find(o => o.value === v);
                    return option ? `${option.emoji} ${option.label}` : v;
                  }).join(', ')
                : 'Not set'}
            </p>
          )}
        </div>

        {/* Matching Preferences */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-blue-600" />
            <span className="font-semibold text-gray-900">Matching Preferences</span>
          </div>
          
          {isEditing ? (
            <div className="space-y-2">
              {GENDER_PREF_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => setGenderPref(option.value)}
                  className={`w-full p-3 rounded-lg border-2 text-left transition-all ${
                    genderPref === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{option.label}</div>
                  <div className="text-xs text-gray-500">{option.description}</div>
                </button>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">
              {userProfile?.genderPref === 'any' && 'Open to connecting with anyone'}
              {userProfile?.genderPref === 'same' && 'Prefer matching with same gender'}
              {!userProfile?.genderPref && 'Not set'}
            </p>
          )}
        </div>
      </div>

      {/* Account Info */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Account Information</h3>
        <div className="space-y-3 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-500">Email</span>
            <span className="text-gray-900">{user?.email}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Member since</span>
            <span className="text-gray-900">
              {userProfile?.createdAt?.toDate 
                ? new Date(userProfile.createdAt.toDate()).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric'
                  })
                : 'Unknown'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">University</span>
            <span className="text-gray-900">UT Austin</span>
          </div>
        </div>
      </div>
    </div>
  );
}
