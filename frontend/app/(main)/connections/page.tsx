'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { getUserConnections, getUserThreads } from '@/lib/firebase/firestore';
import { getUserProfile } from '@/lib/firebase/auth';
import type { Connection, UserProfile } from '@/lib/types';
import { Users, UserCheck, Clock, MessageSquare, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';

type ConnectionWithOther = Connection & { otherDisplayName: string; otherUid: string; isIncoming: boolean; threadId?: string };

export default function ConnectionsPage() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<ConnectionWithOther[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      setConnections([]);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [list, threads] = await Promise.all([
          getUserConnections(user.uid),
          getUserThreads(user.uid),
        ]);
        const connectionIdToThreadId = new Map<string, string>();
        threads.forEach((t) => {
          if (t.connectionId) connectionIdToThreadId.set(t.connectionId, t.id);
        });
        const withOther: ConnectionWithOther[] = [];
        for (const c of list) {
          const otherUid = c.requesterId === user.uid ? c.recipientId : c.requesterId;
          const isIncoming = c.recipientId === user.uid;
          let otherDisplayName = 'Unknown';
          try {
            const profile: UserProfile | null = await getUserProfile(otherUid);
            if (profile?.displayName) otherDisplayName = profile.displayName;
          } catch {
            // ignore
          }
          const threadId = connectionIdToThreadId.get(c.id);
          withOther.push({ ...c, otherDisplayName, otherUid, isIncoming, threadId });
        }
        if (!cancelled) setConnections(withOther);
      } catch (err) {
        console.error('Failed to load connections:', err);
        if (!cancelled) setConnections([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.uid]);

  const incoming = connections.filter((c) => c.isIncoming && c.status === 'pending');
  const sent = connections.filter((c) => !c.isIncoming && c.status === 'pending');
  const accepted = connections.filter((c) => c.status === 'accepted');

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Connections</h1>
        <p className="text-gray-500 mt-1">Manage your concert connection requests</p>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-24 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      ) : (
        <>
          {/* Incoming Requests */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Clock size={18} className="text-yellow-500" />
              <h2 className="text-lg font-semibold text-gray-900">Incoming Requests</h2>
              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full">
                {incoming.length}
              </span>
            </div>
            {incoming.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-gray-300 p-6 text-center">
                <p className="text-gray-400 text-sm">
                  Incoming connection requests will appear here.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {incoming.map((c) => (
                  <li
                    key={c.id}
                    className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between"
                  >
                    <span className="font-medium text-gray-900">{c.otherDisplayName}</span>
                    <span className="text-sm text-gray-500">Concert room</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Sent Requests */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Users size={18} className="text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-900">Sent Requests</h2>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full">
                {sent.length}
              </span>
            </div>
            {sent.length === 0 ? (
              <div className="bg-white rounded-xl border border-dashed border-gray-300 p-6 text-center">
                <p className="text-gray-400 text-sm">
                  Your pending connection requests will appear here.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {sent.map((c) => (
                  <li
                    key={c.id}
                    className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between"
                  >
                    <span className="font-medium text-gray-900">{c.otherDisplayName}</span>
                    <span className="text-sm text-gray-500">Pending</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {/* Accepted Connections */}
          <section>
            <div className="flex items-center gap-2 mb-4">
              <UserCheck size={18} className="text-green-500" />
              <h2 className="text-lg font-semibold text-gray-900">Your Connections</h2>
              <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                {accepted.length}
              </span>
            </div>
            {accepted.length === 0 ? (
              <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-8 h-8 text-gray-400" />
                </div>
                <h3 className="font-medium text-gray-900 mb-2">No connections yet</h3>
                <p className="text-gray-500 text-sm max-w-sm mx-auto">
                  Join a concert room and connect with others who share your music taste!
                </p>
                <Link
                  href="/concerts"
                  className="inline-block mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium"
                >
                  Browse Concerts
                </Link>
              </div>
            ) : (
              <ul className="space-y-2">
                {accepted.map((c) => (
                  <li key={c.id}>
                    <Link
                      href={c.threadId ? `/threads/${c.threadId}` : '/threads'}
                      className="block bg-white rounded-xl border border-gray-200 p-4 hover:border-primary-300 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                            <span className="text-primary-600 font-medium text-sm">
                              {c.otherDisplayName.slice(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{c.otherDisplayName}</p>
                            <p className="text-sm text-gray-500">Concert buddy</p>
                          </div>
                        </div>
                        <LinkIcon size={18} className="text-gray-400" />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
