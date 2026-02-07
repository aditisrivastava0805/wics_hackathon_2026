'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check, X, Clock, MessageSquare, Music } from 'lucide-react';
import { getInitials, formatRelativeTime } from '@/lib/utils';
import type { Connection, UserProfile, Concert, Thread } from '@/lib/types';

interface ConnectionCardProps {
  connection: Connection;
  otherUser: UserProfile;
  concert: Concert | null;
  thread?: Thread | null;
  type: 'incoming' | 'sent' | 'accepted';
  onAccept?: () => Promise<void>;
  onDecline?: () => Promise<void>;
  onViewProfile?: () => void;
}

/**
 * ConnectionCard - Displays a connection request or accepted connection
 */
export function ConnectionCard({
  connection,
  otherUser,
  concert,
  thread,
  type,
  onAccept,
  onDecline,
  onViewProfile,
}: ConnectionCardProps) {
  const [accepting, setAccepting] = useState(false);
  const [declining, setDeclining] = useState(false);

  const handleAccept = async () => {
    if (!onAccept) return;
    setAccepting(true);
    try {
      await onAccept();
    } finally {
      setAccepting(false);
    }
  };

  const handleDecline = async () => {
    if (!onDecline) return;
    setDeclining(true);
    try {
      await onDecline();
    } finally {
      setDeclining(false);
    }
  };

  // Check if avatar is an emoji
  const isEmoji = otherUser.avatarUrl && otherUser.avatarUrl.length <= 4 && !/^https?:\/\//.test(otherUser.avatarUrl);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-sm transition-shadow">
      <div className="flex items-start gap-4">
        {/* Avatar and user info - clickable for profile */}
        <button
          onClick={onViewProfile}
          className="flex items-start gap-4 flex-1 min-w-0 text-left hover:opacity-80 transition-opacity"
        >
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium flex-shrink-0">
            {otherUser.avatarUrl ? (
              isEmoji ? (
                <span className="text-2xl">{otherUser.avatarUrl}</span>
              ) : (
                <img
                  src={otherUser.avatarUrl}
                  alt={otherUser.displayName}
                  className="w-full h-full rounded-full object-cover"
                />
              )
            ) : (
              getInitials(otherUser.displayName || 'U')
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 truncate">
              {otherUser.displayName}
            </h3>
          
          {/* Concert info */}
          {concert && (
            <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-0.5">
              <Music size={14} />
              <span className="truncate">{concert.artist} @ {concert.venue}</span>
            </div>
          )}

          {/* Music preferences */}
          {otherUser.musicPreferences?.genres && otherUser.musicPreferences.genres.length > 0 && (
            <p className="text-xs text-gray-400 mt-1">
              {otherUser.musicPreferences.genres.slice(0, 3).join(', ')}
            </p>
          )}

          {/* Timestamp */}
          <p className="text-xs text-gray-400 mt-1">
            {type === 'incoming' && 'Requested '}
            {type === 'sent' && 'Sent '}
            {type === 'accepted' && 'Connected '}
            {formatRelativeTime(connection.updatedAt || connection.createdAt)}
          </p>
          </div>
        </button>

        {/* Actions */}
        <div className="flex-shrink-0">
          {type === 'incoming' && (
            <div className="flex items-center gap-2">
              <button
                onClick={handleAccept}
                disabled={accepting || declining}
                className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200 transition-colors disabled:opacity-50"
                title="Accept"
              >
                {accepting ? (
                  <div className="w-5 h-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Check size={20} />
                )}
              </button>
              <button
                onClick={handleDecline}
                disabled={accepting || declining}
                className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
                title="Decline"
              >
                {declining ? (
                  <div className="w-5 h-5 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <X size={20} />
                )}
              </button>
            </div>
          )}

          {type === 'sent' && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-lg text-sm">
              <Clock size={14} />
              <span>Pending</span>
            </div>
          )}

          {type === 'accepted' && thread && (
            <Link
              href={`/threads/${thread.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary-100 text-primary-700 rounded-lg text-sm hover:bg-primary-200 transition-colors"
            >
              <MessageSquare size={14} />
              <span>Chat</span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * ConnectionCardSkeleton - Loading placeholder
 */
export function ConnectionCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-gray-200" />
        <div className="flex-1">
          <div className="h-5 bg-gray-200 rounded w-32 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-48 mb-1" />
          <div className="h-3 bg-gray-200 rounded w-24" />
        </div>
        <div className="w-20 h-8 bg-gray-200 rounded-lg" />
      </div>
    </div>
  );
}
