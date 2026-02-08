'use client';

import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import {
  getUserConnections,
  updateConnectionStatus,
  getConcert,
  getThreadByConnectionId,
} from '@/lib/firebase/firestore';
import { getUserProfile } from '@/lib/firebase/auth';
import { ConnectionCard, ConnectionCardSkeleton } from '@/components/connections/ConnectionCard';
import { ProfileModal } from '@/components/profile';
import type { Connection, UserProfile, Concert, Thread } from '@/lib/types';
import { Users, UserCheck, Clock, MessageSquare, AlertCircle, RefreshCw } from 'lucide-react';

interface EnrichedConnection {
  connection: Connection;
  otherUser: UserProfile;
  concert: Concert | null;
  thread: Thread | null;
}

export default function ConnectionsPage() {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [incoming, setIncoming] = useState<EnrichedConnection[]>([]);
  const [sent, setSent] = useState<EnrichedConnection[]>([]);
  const [accepted, setAccepted] = useState<EnrichedConnection[]>([]);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);

  // Load and group connections
  const loadConnections = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      // Fetch all connections for user
      const connections = await getUserConnections(user.uid);
      
      // Separate into categories
      const incomingList: EnrichedConnection[] = [];
      const sentList: EnrichedConnection[] = [];
      const acceptedList: EnrichedConnection[] = [];

      // Enrich each connection with user profile and concert info
      for (const connection of connections) {
        // Skip declined connections
        if (connection.status === 'declined') continue;

        // Determine the other user's ID
        const otherUserId = connection.requesterId === user.uid 
          ? connection.recipientId 
          : connection.requesterId;

        // Fetch other user's profile
        const otherUser = await getUserProfile(otherUserId);
        if (!otherUser) continue;

        // Fetch concert info
        const concert = await getConcert(connection.concertId);

        // Fetch thread if accepted
        let thread: Thread | null = null;
        if (connection.status === 'accepted') {
          thread = await getThreadByConnectionId(connection.id);
        }

        const enriched: EnrichedConnection = {
          connection,
          otherUser,
          concert,
          thread,
        };

        // Categorize
        if (connection.status === 'accepted') {
          acceptedList.push(enriched);
        } else if (connection.status === 'pending') {
          if (connection.recipientId === user.uid) {
            // User is the recipient - incoming request
            incomingList.push(enriched);
          } else {
            // User is the requester - sent request
            sentList.push(enriched);
          }
        }
      }

      // Sort by most recent first
      const sortByDate = (a: EnrichedConnection, b: EnrichedConnection) => {
        const dateA = a.connection.updatedAt?.toDate?.() || a.connection.createdAt?.toDate?.() || new Date(0);
        const dateB = b.connection.updatedAt?.toDate?.() || b.connection.createdAt?.toDate?.() || new Date(0);
        return dateB.getTime() - dateA.getTime();
      };

      setIncoming(incomingList.sort(sortByDate));
      setSent(sentList.sort(sortByDate));
      setAccepted(acceptedList.sort(sortByDate));
    } catch (err) {
      console.error('Failed to load connections:', err);
      setError('Failed to load connections');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadConnections();
  }, [loadConnections]);

  // Handle accept connection
  const handleAccept = async (connectionId: string) => {
    try {
      await updateConnectionStatus(connectionId, 'accepted');
      // Refresh the list
      await loadConnections();
    } catch (err) {
      console.error('Failed to accept connection:', err);
      setError('Failed to accept connection');
    }
  };

  // Handle decline connection
  const handleDecline = async (connectionId: string) => {
    try {
      await updateConnectionStatus(connectionId, 'declined');
      // Remove from incoming list optimistically
      setIncoming((prev) => prev.filter((e) => e.connection.id !== connectionId));
    } catch (err) {
      console.error('Failed to decline connection:', err);
      setError('Failed to decline connection');
    }
  };

  // Loading state
  if (loading) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Connections</h1>
          <p className="text-gray-500 mt-1">Manage your concert connection requests</p>
        </div>

        {/* Skeleton loaders */}
        <section className="mb-8">
          <div className="h-6 bg-gray-200 rounded w-40 mb-4" />
          <div className="space-y-3">
            {[1, 2].map((i) => <ConnectionCardSkeleton key={i} />)}
          </div>
        </section>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div>
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Connections</h1>
          <p className="text-gray-500 mt-1">Manage your concert connection requests</p>
        </div>

        <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="font-medium text-gray-900 mb-2">{error}</h3>
          <button
            onClick={loadConnections}
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const totalConnections = incoming.length + sent.length + accepted.length;

  return (
    <div>
      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Connections</h1>
          <p className="text-gray-500 mt-1">Manage your concert connection requests</p>
        </div>
        <button
          onClick={loadConnections}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title="Refresh"
        >
          <RefreshCw size={20} />
        </button>
      </div>

      {/* Empty state for all sections */}
      {totalConnections === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <MessageSquare className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="font-medium text-gray-900 mb-2">No connections yet</h3>
          <p className="text-gray-500 text-sm max-w-sm mx-auto">
            Join a concert room and connect with others who share your music taste!
          </p>
        </div>
      )}

      {/* Incoming Requests */}
      {incoming.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-yellow-500" />
            <h2 className="text-lg font-semibold text-gray-900">Incoming Requests</h2>
            <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
              {incoming.length}
            </span>
          </div>
          
          <div className="space-y-3">
            {incoming.map((item) => (
              <ConnectionCard
                key={item.connection.id}
                connection={item.connection}
                otherUser={item.otherUser}
                concert={item.concert}
                type="incoming"
                onAccept={() => handleAccept(item.connection.id)}
                onDecline={() => handleDecline(item.connection.id)}
                onViewProfile={() => setViewingProfileId(item.otherUser.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Sent Requests */}
      {sent.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Users size={18} className="text-blue-500" />
            <h2 className="text-lg font-semibold text-gray-900">Sent Requests</h2>
            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
              {sent.length}
            </span>
          </div>
          
          <div className="space-y-3">
            {sent.map((item) => (
              <ConnectionCard
                key={item.connection.id}
                connection={item.connection}
                otherUser={item.otherUser}
                concert={item.concert}
                type="sent"
                onViewProfile={() => setViewingProfileId(item.otherUser.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Accepted Connections */}
      {accepted.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <UserCheck size={18} className="text-green-500" />
            <h2 className="text-lg font-semibold text-gray-900">Your Connections</h2>
            <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
              {accepted.length}
            </span>
          </div>
          
          <div className="space-y-3">
            {accepted.map((item) => (
              <ConnectionCard
                key={item.connection.id}
                connection={item.connection}
                otherUser={item.otherUser}
                concert={item.concert}
                thread={item.thread}
                type="accepted"
                onViewProfile={() => setViewingProfileId(item.otherUser.id)}
              />
            ))}
          </div>
        </section>
      )}

      {/* Show empty states for individual sections when others have data */}
      {totalConnections > 0 && incoming.length === 0 && sent.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={18} className="text-yellow-500" />
            <h2 className="text-lg font-semibold text-gray-900">Incoming Requests</h2>
            <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">0</span>
          </div>
          <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-4 text-center">
            <p className="text-gray-400 text-sm">No incoming requests</p>
          </div>
        </section>
      )}

      {/* Profile Modal */}
      {viewingProfileId && (
        <ProfileModal
          userId={viewingProfileId}
          onClose={() => setViewingProfileId(null)}
        />
      )}
    </div>
  );
}
