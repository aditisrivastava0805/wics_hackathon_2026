'use client';

import { UserPlus, Check, Clock } from 'lucide-react';
import { getInitials } from '@/lib/utils';
import type { UserProfile } from '@/lib/types';

interface MemberCardProps {
  profile: UserProfile;
  compatibilityScore?: number;
  isCurrentUser?: boolean;
  connectionStatus?: 'none' | 'pending' | 'accepted';
  onRequestConnection?: () => void;
}

/**
 * MemberCard - Displays a room member with compatibility score
 */
export function MemberCard({
  profile,
  compatibilityScore,
  isCurrentUser,
  connectionStatus = 'none',
  onRequestConnection,
}: MemberCardProps) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
      {/* Avatar */}
      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium flex-shrink-0">
        {profile.avatarUrl ? (
          <img
            src={profile.avatarUrl}
            alt={profile.displayName}
            className="w-full h-full rounded-full object-cover"
          />
        ) : (
          getInitials(profile.displayName || 'U')
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-gray-900 truncate">
            {profile.displayName}
          </p>
          {isCurrentUser && (
            <span className="text-xs text-gray-500">(you)</span>
          )}
        </div>
        
        {/* Preferences preview */}
        {profile.musicPreferences?.genres && profile.musicPreferences.genres.length > 0 && (
          <p className="text-xs text-gray-500 truncate">
            {profile.musicPreferences.genres.slice(0, 2).join(', ')}
          </p>
        )}

        {/* Compatibility score */}
        {compatibilityScore !== undefined && !isCurrentUser && (
          <div className="mt-1">
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
              compatibilityScore >= 70
                ? 'bg-green-100 text-green-700'
                : compatibilityScore >= 50
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-600'
            }`}>
              {compatibilityScore}% match
            </span>
          </div>
        )}
      </div>

      {/* Action button */}
      {!isCurrentUser && (
        <div>
          {connectionStatus === 'none' && onRequestConnection && (
            <button
              onClick={onRequestConnection}
              className="p-2 text-primary-600 hover:bg-primary-100 rounded-lg transition-colors"
              title="Request connection"
            >
              <UserPlus size={18} />
            </button>
          )}
          {connectionStatus === 'pending' && (
            <div className="p-2 text-yellow-600" title="Request pending">
              <Clock size={18} />
            </div>
          )}
          {connectionStatus === 'accepted' && (
            <div className="p-2 text-green-600" title="Connected">
              <Check size={18} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * MemberCardSkeleton - Loading placeholder
 */
export function MemberCardSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 animate-pulse">
      <div className="w-10 h-10 rounded-full bg-gray-200" />
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-24 mb-1" />
        <div className="h-3 bg-gray-200 rounded w-16" />
      </div>
      <div className="w-8 h-8 bg-gray-200 rounded-lg" />
    </div>
  );
}
