'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { getUserThreads } from '@/lib/firebase/firestore';
import { getUserProfile } from '@/lib/firebase/auth';
import { getConcert } from '@/lib/firebase/firestore';
import type { Thread, UserProfile, Concert } from '@/lib/types';
import { MessageSquare, PartyPopper } from 'lucide-react';

type ThreadWithDetails = Thread & {
  otherDisplayName: string;
  concertName?: string;
};

export default function ThreadsPage() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<ThreadWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      setThreads([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const list = await getUserThreads(user.uid);
        const withDetails: ThreadWithDetails[] = [];
        for (const t of list) {
          const otherUid = t.participants[0] === user.uid ? t.participants[1] : t.participants[0];
          let otherDisplayName = 'Unknown';
          let concertName: string | undefined;
          try {
            const [profile, concert]: [UserProfile | null, Concert | null] = await Promise.all([
              getUserProfile(otherUid),
              getConcert(t.concertId),
            ]);
            if (profile?.displayName) otherDisplayName = profile.displayName;
            if (concert?.name) concertName = concert.name;
          } catch {
            // ignore
          }
          withDetails.push({ ...t, otherDisplayName, concertName });
        }
        if (!cancelled) setThreads(withDetails);
      } catch (err) {
        console.error('Failed to load threads:', err);
        if (!cancelled) setThreads([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.uid]);

  const goingTogetherCount = threads.filter((t) =>
    t.goingTogether && t.goingTogether[user?.uid ?? ''] === true
  ).length;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
        <p className="text-gray-500 mt-1">
          Private conversations with your concert connections
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : threads.length === 0 ? (
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
      ) : (
        <ul className="space-y-3">
          {threads.map((t) => (
            <li key={t.id}>
              <Link
                href={`/threads/${t.id}`}
                className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-primary-300 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-primary-600 font-medium">
                      {t.otherDisplayName.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-gray-900 truncate">
                        {t.otherDisplayName}
                      </span>
                      {t.goingTogether?.[user?.uid ?? ''] && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-accent-100 text-accent-700 text-xs rounded-full">
                          <PartyPopper size={10} />
                          Going Together!
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {t.concertName ?? 'Concert buddy'}
                    </p>
                  </div>
                  <MessageSquare size={18} className="text-gray-400 flex-shrink-0" />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
