'use client';

import Link from 'next/link';
import { PartyPopper } from 'lucide-react';
import { getInitials, formatRelativeTime } from '@/lib/utils';
import type { Thread, UserProfile, Concert } from '@/lib/types';

interface ThreadCardProps {
  thread: Thread;
  otherUser: UserProfile;
  concert: Concert | null;
  currentUserId: string;
}

/**
 * ThreadCard - Display a thread in the threads list
 */
export function ThreadCard({
  thread,
  otherUser,
  concert,
  currentUserId,
}: ThreadCardProps) {
  const bothGoingTogether = 
    thread.goingTogether[currentUserId] && 
    thread.goingTogether[otherUser.id];

  return (
    <Link href={`/threads/${thread.id}`}>
      <div className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-primary-200 transition-all cursor-pointer">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium flex-shrink-0">
            {otherUser.avatarUrl ? (
              <img
                src={otherUser.avatarUrl}
                alt={otherUser.displayName}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials(otherUser.displayName || 'U')
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900 truncate">
                {otherUser.displayName}
              </p>
              {bothGoingTogether && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-accent-100 text-accent-700 text-xs rounded-full whitespace-nowrap">
                  <PartyPopper size={10} />
                  Going Together!
                </span>
              )}
            </div>
            {concert && (
              <p className="text-sm text-gray-500 truncate">
                {concert.artist} @ {concert.venue}
              </p>
            )}
          </div>

          {/* Time */}
          <div className="text-xs text-gray-400 whitespace-nowrap">
            {formatRelativeTime(thread.createdAt)}
          </div>
        </div>
      </div>
    </Link>
  );
}

/**
 * ThreadCardSkeleton - Loading placeholder
 */
export function ThreadCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-gray-200" />
        <div className="flex-1">
          <div className="h-5 bg-gray-200 rounded w-32 mb-2" />
          <div className="h-4 bg-gray-200 rounded w-48" />
        </div>
        <div className="h-3 bg-gray-200 rounded w-12" />
      </div>
    </div>
  );
}
