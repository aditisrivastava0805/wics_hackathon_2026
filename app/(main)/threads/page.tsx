'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getUserThreads, getConcert } from '@/lib/firebase/firestore';
import { getUserProfile } from '@/lib/firebase/auth';
import { useAuth } from '@/context/auth-context';
import { getInitials, formatRelativeTime } from '@/lib/utils';
import type { Thread, UserProfile, Concert } from '@/lib/types';
import { PartyPopper } from 'lucide-react';

interface EnrichedThread extends Thread {
  otherUser?: UserProfile;
  concert?: Concert;
}

export default function ThreadsPage() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<EnrichedThread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function loadThreads() {
      try {
        const data = await getUserThreads(user!.uid);

        // Enrich with user profiles and concert data
        const enriched = await Promise.all(
          data.map(async (thread) => {
            const otherUserId = thread.participants.find((p) => p !== user!.uid);
            const [otherUser, concert] = await Promise.all([
              otherUserId ? getUserProfile(otherUserId) : null,
              getConcert(thread.concertId),
            ]);
            return {
              ...thread,
              otherUser: otherUser || undefined,
              concert: concert || undefined,
            };
          })
        );

        setThreads(enriched);
      } catch (err) {
        console.error('Failed to load threads:', err);
      } finally {
        setLoading(false);
      }
    }

    loadThreads();
  }, [user]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Messages</h1>

      {threads.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
          <p className="text-gray-500">No conversations yet</p>
          <p className="text-sm text-gray-400 mt-1">
            Connect with someone in a concert room to start chatting!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {threads.map((thread) => {
            const isGoingTogether =
              user &&
              thread.goingTogether[user.uid] &&
              thread.goingTogether[thread.participants.find((p) => p !== user.uid) || ''];

            return (
              <Link
                key={thread.id}
                href={`/threads/${thread.id}`}
                className="block bg-white rounded-xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                    {getInitials(thread.otherUser?.displayName || 'U')}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-gray-900">
                        {thread.otherUser?.displayName || 'User'}
                      </p>
                      {isGoingTogether && (
                        <span className="flex items-center gap-1 px-2 py-0.5 bg-accent-100 text-accent-700 text-xs rounded-full">
                          <PartyPopper size={12} />
                          Going Together!
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{thread.concert?.name || 'Concert'}</p>
                  </div>
                  <p className="text-xs text-gray-400">
                    {formatRelativeTime(thread.createdAt)}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
