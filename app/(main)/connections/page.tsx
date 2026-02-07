'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getUserConnections, updateConnectionStatus } from '@/lib/firebase/firestore';
import { getUserProfile } from '@/lib/firebase/auth';
import { getConcert } from '@/lib/firebase/firestore';
import { useAuth } from '@/context/auth-context';
import { getInitials, formatRelativeTime } from '@/lib/utils';
import type { Connection, UserProfile, Concert } from '@/lib/types';
import { Check, X, MessageSquare } from 'lucide-react';

interface EnrichedConnection extends Connection {
  otherUser?: UserProfile;
  concert?: Concert;
}

export default function ConnectionsPage() {
  const { user } = useAuth();
  const [connections, setConnections] = useState<EnrichedConnection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function loadConnections() {
      try {
        const data = await getUserConnections(user!.uid);
        
        // Enrich with user profiles and concert data
        const enriched = await Promise.all(
          data.map(async (conn) => {
            const otherUserId =
              conn.requesterId === user!.uid ? conn.recipientId : conn.requesterId;
            const [otherUser, concert] = await Promise.all([
              getUserProfile(otherUserId),
              getConcert(conn.concertId),
            ]);
            return { ...conn, otherUser: otherUser || undefined, concert: concert || undefined };
          })
        );

        setConnections(enriched);
      } catch (err) {
        console.error('Failed to load connections:', err);
      } finally {
        setLoading(false);
      }
    }

    loadConnections();
  }, [user]);

  const handleAccept = async (connectionId: string) => {
    try {
      await updateConnectionStatus(connectionId, 'accepted');
      setConnections((prev) =>
        prev.map((c) => (c.id === connectionId ? { ...c, status: 'accepted' } : c))
      );
    } catch (err) {
      console.error('Failed to accept connection:', err);
    }
  };

  const handleDecline = async (connectionId: string) => {
    try {
      await updateConnectionStatus(connectionId, 'declined');
      setConnections((prev) =>
        prev.map((c) => (c.id === connectionId ? { ...c, status: 'declined' } : c))
      );
    } catch (err) {
      console.error('Failed to decline connection:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const pendingReceived = connections.filter(
    (c) => c.status === 'pending' && c.recipientId === user?.uid
  );
  const pendingSent = connections.filter(
    (c) => c.status === 'pending' && c.requesterId === user?.uid
  );
  const accepted = connections.filter((c) => c.status === 'accepted');

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Connections</h1>

      {/* Pending Received */}
      {pendingReceived.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Connection Requests ({pendingReceived.length})
          </h2>
          <div className="space-y-3">
            {pendingReceived.map((conn) => (
              <div
                key={conn.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                  {getInitials(conn.otherUser?.displayName || 'U')}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {conn.otherUser?.displayName || 'User'}
                  </p>
                  <p className="text-sm text-gray-500">
                    For: {conn.concert?.name || 'Concert'}
                  </p>
                  <p className="text-xs text-gray-400">
                    {formatRelativeTime(conn.createdAt)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(conn.id)}
                    className="p-2 bg-green-100 text-green-600 rounded-lg hover:bg-green-200"
                    title="Accept"
                  >
                    <Check size={20} />
                  </button>
                  <button
                    onClick={() => handleDecline(conn.id)}
                    className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                    title="Decline"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Pending Sent */}
      {pendingSent.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Sent Requests ({pendingSent.length})
          </h2>
          <div className="space-y-3">
            {pendingSent.map((conn) => (
              <div
                key={conn.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-medium">
                  {getInitials(conn.otherUser?.displayName || 'U')}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {conn.otherUser?.displayName || 'User'}
                  </p>
                  <p className="text-sm text-gray-500">
                    For: {conn.concert?.name || 'Concert'}
                  </p>
                </div>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-sm rounded-full">
                  Pending
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Accepted */}
      <section>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Your Connections ({accepted.length})
        </h2>
        {accepted.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <p className="text-gray-500">No connections yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Join a concert room and connect with others!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {accepted.map((conn) => (
              <div
                key={conn.id}
                className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 flex items-center gap-4"
              >
                <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                  {getInitials(conn.otherUser?.displayName || 'U')}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {conn.otherUser?.displayName || 'User'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {conn.concert?.name || 'Concert'}
                  </p>
                </div>
                <Link
                  href={`/threads?connection=${conn.id}`}
                  className="p-2 bg-primary-100 text-primary-600 rounded-lg hover:bg-primary-200"
                >
                  <MessageSquare size={20} />
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
