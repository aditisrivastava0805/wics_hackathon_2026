'use client';

import { useEffect } from 'react';
import { X, User, Mail, Music, DollarSign, Sparkles } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import type { UserProfile } from '@/lib/types';

interface ProfileModalProps {
  profile: UserProfile | null;
  onClose: () => void;
}

/**
 * ProfileModal - Read-only view of another user's profile (from MemberCard or thread header).
 */
export function ProfileModal({ profile, onClose }: ProfileModalProps) {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  if (!profile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Profile</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-4">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.displayName}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium text-xl">
                {getInitials(profile.displayName || 'U')}
              </div>
            )}
            <div>
              <h3 className="text-xl font-semibold text-gray-900">
                {profile.displayName || 'Unknown'}
              </h3>
              {profile.email && (
                <p className="text-gray-500 flex items-center gap-1 text-sm">
                  <Mail size={14} />
                  {profile.email}
                </p>
              )}
            </div>
          </div>

          {profile.bio && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-700">{profile.bio}</p>
            </div>
          )}

          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Music size={16} className="text-primary-600" />
              <span className="font-medium text-gray-700">Music Preferences</span>
            </div>
            <div className="text-sm text-gray-600">
              <p>
                <span className="text-gray-500">Genres:</span>{' '}
                {profile.musicPreferences?.genres?.join(', ') || 'Not set'}
              </p>
              <p>
                <span className="text-gray-500">Artists:</span>{' '}
                {profile.musicPreferences?.artists?.join(', ') || 'Not set'}
              </p>
            </div>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign size={16} className="text-green-600" />
              <span className="font-medium text-gray-700">Budget</span>
            </div>
            <p className="text-sm text-gray-600">
              {profile.budgetRange === 'under40' && 'Under $40'}
              {profile.budgetRange === '40to80' && '$40 - $80'}
              {profile.budgetRange === 'flexible' && 'Flexible'}
              {!profile.budgetRange && 'Not set'}
            </p>
          </div>

          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={16} className="text-purple-600" />
              <span className="font-medium text-gray-700">Concert Vibes</span>
            </div>
            <p className="text-sm text-gray-600">
              {profile.concertVibes?.map((v) => {
                if (v === 'moshPit') return 'Mosh Pit Energy';
                if (v === 'chillBalcony') return 'Chill Balcony';
                if (v === 'indieListening') return 'Indie Listening';
                return v;
              }).join(', ') || 'Not set'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
