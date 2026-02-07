'use client';

import { useEffect, useState } from 'react';
import { getUserProfile } from '@/lib/firebase/auth';
import { Spinner } from '@/components/ui/spinner';
import type { UserProfile } from '@/lib/types';
import { 
  X, 
  Music, 
  DollarSign, 
  Sparkles, 
  Mail,
  Users
} from 'lucide-react';

interface ProfileModalProps {
  userId: string;
  onClose: () => void;
}

const VIBE_LABELS: Record<string, { label: string; emoji: string }> = {
  moshPit: { label: 'Mosh Pit', emoji: '🤘' },
  chillBalcony: { label: 'Chill Balcony', emoji: '🥂' },
  indieListening: { label: 'Indie Listening', emoji: '🎧' },
};

const BUDGET_LABELS: Record<string, string> = {
  under40: 'Under $40',
  '40to80': '$40 - $80',
  flexible: 'Flexible',
};

export function ProfileModal({ userId, onClose }: ProfileModalProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getUserProfile(userId);
        setProfile(data);
      } catch (err) {
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
  }, []);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Modal */}
      <div 
        className="relative bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors z-10"
        >
          <X size={20} className="text-gray-500" />
        </button>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" />
          </div>
        ) : error || !profile ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-gray-500">{error || 'Profile not found'}</p>
            <button
              onClick={onClose}
              className="mt-4 text-primary-600 hover:text-primary-700"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="pt-8 pb-4 px-6 text-center border-b border-gray-100">
              <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center text-5xl mx-auto mb-4">
                {profile.avatarUrl || '🎸'}
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                {profile.displayName}
              </h2>
              {profile.bio && (
                <p className="text-gray-600 mt-2 text-sm">{profile.bio}</p>
              )}
            </div>

            {/* Content */}
            <div className="p-6 space-y-5">
              {/* Music Preferences */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Music size={16} className="text-primary-600" />
                  <span className="font-medium text-gray-700 text-sm">Music Preferences</span>
                </div>
                <div className="text-sm text-gray-600 space-y-1">
                  {profile.musicPreferences?.genres?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {profile.musicPreferences.genres.map((genre) => (
                        <span 
                          key={genre}
                          className="px-2 py-0.5 bg-primary-50 text-primary-700 rounded-full text-xs"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}
                  {profile.musicPreferences?.artists?.length > 0 && (
                    <p className="mt-2">
                      <span className="text-gray-400">Artists:</span>{' '}
                      {profile.musicPreferences.artists.join(', ')}
                    </p>
                  )}
                  {(!profile.musicPreferences?.genres?.length && !profile.musicPreferences?.artists?.length) && (
                    <p className="text-gray-400">No preferences set</p>
                  )}
                </div>
              </div>

              {/* Budget */}
              {profile.budgetRange && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign size={16} className="text-green-600" />
                    <span className="font-medium text-gray-700 text-sm">Budget</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {BUDGET_LABELS[profile.budgetRange] || profile.budgetRange}
                  </p>
                </div>
              )}

              {/* Concert Vibes */}
              {profile.concertVibes?.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles size={16} className="text-purple-600" />
                    <span className="font-medium text-gray-700 text-sm">Concert Vibes</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {profile.concertVibes.map((vibe) => {
                      const vibeInfo = VIBE_LABELS[vibe];
                      return (
                        <span 
                          key={vibe}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-purple-50 text-purple-700 rounded-full text-xs"
                        >
                          {vibeInfo?.emoji} {vibeInfo?.label || vibe}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Matching Preferences */}
              {profile.genderPref && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Users size={16} className="text-blue-600" />
                    <span className="font-medium text-gray-700 text-sm">Matching</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {profile.genderPref === 'any' ? 'Open to connecting with anyone' : 'Prefers same gender'}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
