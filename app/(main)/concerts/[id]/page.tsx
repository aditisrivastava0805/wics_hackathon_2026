'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import {
  getConcert,
  getRoomMembers,
  joinConcertRoom,
  requestConnection,
  getUserConnections,
  subscribeToRoomMembers,
} from '@/lib/firebase/firestore';
import { getUserProfile } from '@/lib/firebase/auth';
import { calculateUserCompatibility } from '@/lib/matching';
import { formatDate } from '@/lib/utils';
import { MemberCard, MemberCardSkeleton } from '@/components/room/MemberCard';
import { RoomChat } from '@/components/room/RoomChat';
import { ProfileModal } from '@/components/profile';
import type { Concert, RoomMember, UserProfile, Connection } from '@/lib/types';
import { ArrowLeft, Users, Calendar, MapPin, DollarSign, AlertCircle, LogIn } from 'lucide-react';

export default function ConcertRoomPage() {
  const params = useParams();
  const concertId = params.id as string;
  const { user, userProfile } = useAuth();

  // State
  const [concert, setConcert] = useState<Concert | null>(null);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [memberProfiles, setMemberProfiles] = useState<Record<string, UserProfile>>({});
  const [connections, setConnections] = useState<Connection[]>([]);
  const [hasJoined, setHasJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);

  // Fetch profiles for members
  const fetchMemberProfiles = useCallback(async (membersList: RoomMember[]) => {
    const profiles: Record<string, UserProfile> = {};
    for (const member of membersList) {
      try {
        const profile = await getUserProfile(member.userId);
        if (profile) {
          profiles[member.userId] = profile;
        }
      } catch (err) {
        console.error(`Failed to fetch profile for ${member.userId}:`, err);
      }
    }
    setMemberProfiles((prev) => ({ ...prev, ...profiles }));
  }, []);

  // Load concert data
  useEffect(() => {
    async function loadConcert() {
      if (!user) return;
      
      setLoading(true);
      setError(null);

      try {
        // Fetch concert details
        const concertData = await getConcert(concertId);
        if (!concertData) {
          setError('Concert not found');
          setLoading(false);
          return;
        }
        setConcert(concertData);

        // Fetch user connections
        const userConnections = await getUserConnections(user.uid);
        setConnections(userConnections);
      } catch (err) {
        console.error('Failed to load concert:', err);
        setError('Failed to load concert room');
      } finally {
        setLoading(false);
      }
    }

    loadConcert();
  }, [concertId, user]);

  // Subscribe to room members (real-time)
  useEffect(() => {
    if (!user || !concert) return;

    const unsubscribe = subscribeToRoomMembers(concertId, async (membersData) => {
      setMembers(membersData);
      
      // Check if current user has joined
      const userHasJoined = membersData.some((m) => m.userId === user.uid);
      setHasJoined(userHasJoined);

      // Fetch profiles for new members
      await fetchMemberProfiles(membersData);
    });

    return () => unsubscribe();
  }, [concertId, user, concert, fetchMemberProfiles]);

  // Make sure current user's profile is in memberProfiles
  useEffect(() => {
    if (user && userProfile && hasJoined) {
      setMemberProfiles((prev) => ({ ...prev, [user.uid]: userProfile }));
    }
  }, [user, userProfile, hasJoined]);

  // Handle join room
  const handleJoinRoom = async () => {
    if (!user) return;

    setJoining(true);
    setError(null);
    
    try {
      console.log('Joining room...', { concertId, userId: user.uid });
      await joinConcertRoom(concertId, user.uid);
      console.log('Join successful');
      
      // The real-time subscription will update the members list
      // But let's also add ourselves immediately for better UX
      setHasJoined(true);
      
      // Add current user's profile to memberProfiles
      if (userProfile) {
        setMemberProfiles((prev) => ({ ...prev, [user.uid]: userProfile }));
      } else {
        // Try to fetch the profile
        const profile = await getUserProfile(user.uid);
        if (profile) {
          setMemberProfiles((prev) => ({ ...prev, [user.uid]: profile }));
        }
      }
    } catch (err) {
      console.error('Failed to join room:', err);
      setError('Failed to join room. Please try again.');
      setHasJoined(false);
    } finally {
      setJoining(false);
    }
  };

  // Handle connection request
  const handleRequestConnection = async (recipientId: string) => {
    if (!user) return;

    try {
      await requestConnection(concertId, user.uid, recipientId);
      // Update local connections state
      setConnections((prev) => [
        ...prev,
        {
          id: 'temp-' + Date.now(),
          concertId,
          requesterId: user.uid,
          recipientId,
          status: 'pending',
          createdAt: { toDate: () => new Date() } as any,
          updatedAt: { toDate: () => new Date() } as any,
        },
      ]);
    } catch (err) {
      console.error('Failed to request connection:', err);
    }
  };

  // Get connection status for a member
  const getConnectionStatus = (memberId: string): 'none' | 'pending' | 'accepted' => {
    const connection = connections.find(
      (c) =>
        c.concertId === concertId &&
        ((c.requesterId === user?.uid && c.recipientId === memberId) ||
          (c.recipientId === user?.uid && c.requesterId === memberId))
    );
    if (!connection) return 'none';
    return connection.status === 'accepted' ? 'accepted' : 'pending';
  };

  // Get compatibility score
  const getCompatibilityScore = (profile: UserProfile): number | undefined => {
    if (!userProfile) return undefined;
    return calculateUserCompatibility(userProfile, profile);
  };

  // Sort members by compatibility
  const sortedMembers = [...members].sort((a, b) => {
    if (a.userId === user?.uid) return -1; // Current user first
    if (b.userId === user?.uid) return 1;
    
    const profileA = memberProfiles[a.userId];
    const profileB = memberProfiles[b.userId];
    if (!profileA || !profileB || !userProfile) return 0;
    
    const scoreA = calculateUserCompatibility(userProfile, profileA);
    const scoreB = calculateUserCompatibility(userProfile, profileB);
    return scoreB - scoreA;
  });

  // Loading state
  if (loading) {
    return (
      <div>
        <Link
          href="/concerts"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={18} />
          <span>Back to Concerts</span>
        </Link>
        
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6 animate-pulse">
          <div className="flex items-start gap-4">
            <div className="w-24 h-24 bg-gray-200 rounded-lg" />
            <div className="flex-1">
              <div className="h-6 bg-gray-200 rounded w-48 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
              <div className="h-3 bg-gray-200 rounded w-40" />
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1 space-y-3">
            {[1, 2, 3].map((i) => (
              <MemberCardSkeleton key={i} />
            ))}
          </div>
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl border border-gray-200 h-[450px] animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !concert) {
    return (
      <div>
        <Link
          href="/concerts"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={18} />
          <span>Back to Concerts</span>
        </Link>
        
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {error || 'Concert not found'}
          </h2>
          <Link
            href="/concerts"
            className="inline-block mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg"
          >
            Back to Concerts
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Back button */}
      <Link
        href="/concerts"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft size={18} />
        <span>Back to Concerts</span>
      </Link>

      {/* Concert Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          {/* Image */}
          <div className="w-full sm:w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
            {concert.imageUrl ? (
              <img
                src={concert.imageUrl}
                alt={concert.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gray-400 text-sm">No image</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900">{concert.name}</h1>
            <p className="text-primary-600 font-medium text-lg">{concert.artist}</p>
            
            <div className="mt-3 space-y-1 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-gray-400" />
                <span>{formatDate(concert.date)}</span>
              </div>
              <div className="flex items-center gap-2">
                <MapPin size={14} className="text-gray-400" />
                <span>{concert.venue}</span>
              </div>
              <div className="flex items-center gap-2">
                <DollarSign size={14} className="text-gray-400" />
                <span>{concert.priceRange}</span>
              </div>
            </div>

            <div className="mt-2">
              <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                {concert.genre}
              </span>
            </div>
          </div>
        </div>

        {/* Join button */}
        {!hasJoined && (
          <button
            onClick={handleJoinRoom}
            disabled={joining}
            className="mt-4 w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors disabled:opacity-50"
          >
            <LogIn size={18} />
            {joining ? 'Joining...' : 'Join This Room'}
          </button>
        )}

        {hasJoined && (
          <div className="mt-4 px-4 py-2 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            You&apos;re in this room! Connect with others and start chatting.
          </div>
        )}
      </div>

      {/* Room Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Members Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-4">
              <Users size={18} className="text-gray-500" />
              <h2 className="font-semibold text-gray-900">
                Room Members ({members.length})
              </h2>
            </div>

            {members.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                No one has joined yet. Be the first!
              </p>
            ) : (
              <div className="space-y-2">
                {sortedMembers.map((member) => {
                  const profile = memberProfiles[member.userId];
                  const isCurrentUser = member.userId === user?.uid;
                  const connectionStatus = isCurrentUser ? 'none' : getConnectionStatus(member.userId);

                  // Create a fallback profile if none exists
                  const displayProfile: UserProfile = profile || {
                    id: member.userId,
                    email: '',
                    displayName: isCurrentUser ? (user?.email?.split('@')[0] || 'You') : 'Loading...',
                    avatarUrl: null,
                    bio: null,
                    spotifyConnected: false,
                    musicPreferences: { genres: [], artists: [] },
                    budgetRange: 'flexible',
                    genderPref: 'any',
                    concertVibes: [],
                    createdAt: null as any,
                    updatedAt: null as any,
                  };

                  return (
                    <MemberCard
                      key={member.id || member.userId}
                      profile={displayProfile}
                      isCurrentUser={isCurrentUser}
                      compatibilityScore={isCurrentUser || !profile ? undefined : getCompatibilityScore(profile)}
                      connectionStatus={connectionStatus}
                      onRequestConnection={
                        hasJoined && connectionStatus === 'none' && !isCurrentUser
                          ? () => handleRequestConnection(member.userId)
                          : undefined
                      }
                      onViewProfile={!isCurrentUser ? () => setViewingProfileId(member.userId) : undefined}
                    />
                  );
                })}
              </div>
            )}

            {!hasJoined && members.length > 0 && (
              <p className="mt-4 text-xs text-gray-400 text-center">
                Join the room to connect with members
              </p>
            )}
          </div>
        </div>

        {/* Chat Section */}
        <div className="lg:col-span-2">
          <RoomChat
            concertId={concertId}
            currentUserId={user?.uid || ''}
            memberProfiles={memberProfiles}
            disabled={!hasJoined}
          />
        </div>
      </div>

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
