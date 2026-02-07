'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { getUserThreads, getConcert } from '@/lib/firebase/firestore';
import { getUserProfile } from '@/lib/firebase/auth';
import { ThreadCard, ThreadCardSkeleton } from '@/components/thread/ThreadCard';
import type { Thread, UserProfile, Concert } from '@/lib/types';
import { MessageSquare, RefreshCw, AlertCircle } from 'lucide-react';

interface EnrichedThread {
  thread: Thread;
  otherUser: UserProfile;
  concert: Concert | null;
}

export default function ThreadsPage() {
  const { user } = useAuth();
  
  const [threads, setThreads] = useState<EnrichedThread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadThreads = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch all threads for user
      const userThreads = await getUserThreads(user.uid);
      
      // Enrich each thread with user profile and concert info
      const enrichedThreads: EnrichedThread[] = [];

      for (const thread of userThreads) {
        // Find the other participant
        const otherUserId = thread.participants.find((p) => p !== user.uid);
        if (!otherUserId) continue;

        // Fetch other user's profile
        const otherUser = await getUserProfile(otherUserId);
        if (!otherUser) continue;

        // Fetch concert info
        const concert = await getConcert(thread.concertId);

        enrichedThreads.push({
          thread,
          otherUser,
          concert,
        });
      }

      // Sort by most recent first
      enrichedThreads.sort((a, b) => {
        const dateA = a.thread.createdAt?.toDate?.() || new Date(0);
        const dateB = b.thread.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      });

      setThreads(enrichedThreads);
    } catch (err) {
      console.error('Failed to load threads:', err);
      setError('Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  // Loading state
  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-500 mt-1">Private conversations with your concert connections</p>
        </div>

        <div className="space-y-3">
          {[1, 2, 3].map((i) => <ThreadCardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-500 mt-1">Private conversations with your concert connections</p>
        </div>

        <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="font-medium text-gray-900 mb-2">{error}</h3>
          <button
            onClick={loadThreads}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-gray-500 mt-1">Private conversations with your concert connections</p>
        </div>
        <button
          onClick={loadThreads}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      {/* Empty state */}
      {threads.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            No conversations yet
          </h2>
          <p className="text-gray-500 mb-6 max-w-sm mx-auto">
            When someone accepts your connection request (or you accept theirs),
            a private thread will appear here.
          </p>
          <Link
            href="/concerts"
            className="inline-block px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Browse Concerts
          </Link>
        </div>
      )}

      {/* Thread list */}
      {threads.length > 0 && (
        <div className="space-y-3">
          {threads.map((item) => (
            <ThreadCard
              key={item.thread.id}
              thread={item.thread}
              otherUser={item.otherUser}
              concert={item.concert}
              currentUserId={user?.uid || ''}
            />
          ))}
        </div>
      )}
    </div>
  );
}
