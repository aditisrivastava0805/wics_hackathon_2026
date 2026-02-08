'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import {
  fetchEvents,
  eventToConcert,
  joinRoom,
  checkRoomJoined,
  fetchRoomPeople,
  getConnectionStatus as getConnectionStatusApi,
  requestConnection,
  type RoomPerson,
} from '@/lib/backend-client';
import { formatDate } from '@/lib/utils';
import { MemberCard, MemberCardSkeleton } from '@/components/room/MemberCard';
import { RoomChat } from '@/components/room/RoomChat';
import { ProfileModal } from '@/components/profile/ProfileModal';
import type { Concert, UserProfile } from '@/lib/types';
import { ArrowLeft, Users, Calendar, MapPin, DollarSign, AlertCircle, LogIn } from 'lucide-react';

/** Build a UserProfile-like object from backend RoomPerson for MemberCard */
function roomPersonToProfile(person: RoomPerson, isCurrentUser: boolean): UserProfile {
  return {
    id: person.email,
    email: person.email,
    displayName: person.name || person.email.split('@')[0] || 'User',
    avatarUrl: person.avatar || null,
    bio: null,
    spotifyConnected: false,
    musicPreferences: {
      genres: [],
      artists: person.common_artists || [],
    },
    budgetRange: 'flexible',
    genderPref: 'any',
    concertVibes: [],
    createdAt: null as any,
    updatedAt: null as any,
  };
}

function isValidConcertId(id: unknown): id is string {
  if (id == null) return false;
  const s = String(id).trim();
  return s.length > 0 && s !== 'undefined' && s !== 'null';
}

export default function ConcertRoomPage() {
  const params = useParams();
  const router = useRouter();
  const concertId = params.id as string;
  const { user, userProfile } = useAuth();

  // Redirect to list if id is missing or invalid
  useEffect(() => {
    if (!isValidConcertId(concertId)) {
      router.replace('/concerts');
    }
  }, [concertId, router]);
  const userEmail = user?.email ?? null;

  const [concert, setConcert] = useState<Concert | null>(null);
  const [people, setPeople] = useState<RoomPerson[]>([]);
  const [connectionStatusByEmail, setConnectionStatusByEmail] = useState<Record<string, 'none' | 'pending' | 'accepted'>>({});
  const [hasJoined, setHasJoined] = useState(false);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileModalUser, setProfileModalUser] = useState<UserProfile | null>(null);

  // Load concert from backend events (match by string id)
  useEffect(() => {
    if (!isValidConcertId(concertId)) return;
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const events = await fetchEvents({ musicOnly: true, max: 50 });
        const event = events.find((e) => e.id != null && String(e.id) === String(concertId));
        if (cancelled) return;
        if (!event) {
          setError('Concert not found');
          setLoading(false);
          return;
        }
        setConcert(eventToConcert(event));
      } catch (err) {
        if (!cancelled) {
          console.error('Failed to load concert:', err);
          setError('Failed to load concert');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [concertId]);

  // Check if current user has joined and load room people (backend)
  useEffect(() => {
    if (!userEmail || !concert) return;

    async function checkAndLoad() {
      try {
        const [joined, roomPeople] = await Promise.all([
          checkRoomJoined(concertId, userEmail),
          fetchRoomPeople(concertId, userEmail),
        ]);
        setHasJoined(joined);
        setPeople(roomPeople);

        const statuses: Record<string, 'none' | 'pending' | 'accepted'> = {};
        await Promise.all(
          roomPeople.map(async (p) => {
            const res = await getConnectionStatusApi(userEmail, p.email, concertId);
            statuses[p.email] = res.status === 'accepted' ? 'accepted' : res.status === 'pending' ? 'pending' : 'none';
          })
        );
        setConnectionStatusByEmail(statuses);
      } catch (err) {
        console.error('Failed to load room data:', err);
      }
    }
    checkAndLoad();
  }, [concertId, userEmail, concert]);

  const refreshRoomPeople = useCallback(async () => {
    if (!userEmail || !concert) return;
    try {
      const [joined, roomPeople] = await Promise.all([
        checkRoomJoined(concertId, userEmail),
        fetchRoomPeople(concertId, userEmail),
      ]);
      setHasJoined(joined);
      setPeople(roomPeople);
      const statuses: Record<string, 'none' | 'pending' | 'accepted'> = {};
      await Promise.all(
        roomPeople.map(async (p) => {
          const res = await getConnectionStatusApi(userEmail, p.email, concertId);
          statuses[p.email] = res.status === 'accepted' ? 'accepted' : res.status === 'pending' ? 'pending' : 'none';
        })
      );
      setConnectionStatusByEmail(statuses);
    } catch (err) {
      console.error('Failed to refresh room:', err);
    }
  }, [concertId, userEmail, concert]);

  // Handle join room (backend)
  const handleJoinRoom = async () => {
    if (!user || !user.email || !concert) return;

    setJoining(true);
    setError(null);
    try {
      await joinRoom(user.email, concertId, concert.name);
      setHasJoined(true);
      await refreshRoomPeople();
    } catch (err) {
      console.error('Failed to join room:', err);
      setError('Failed to join room. Please try again.');
    } finally {
      setJoining(false);
    }
  };

  const handleRequestConnection = async (recipientEmail: string) => {
    if (!user?.email) return;
    try {
      await requestConnection(user.email, recipientEmail, concertId);
      setConnectionStatusByEmail((prev) => ({ ...prev, [recipientEmail]: 'pending' }));
    } catch (err) {
      console.error('Failed to request connection:', err);
    }
  };

  const getConnectionStatus = (email: string): 'none' | 'pending' | 'accepted' => {
    return connectionStatusByEmail[email] ?? 'none';
  };

  // Member profiles keyed by email (for MemberCard and RoomChat)
  const memberProfiles: Record<string, UserProfile> = {};
  people.forEach((p) => {
    memberProfiles[p.email] = roomPersonToProfile(p, false);
  });
  if (user && userProfile && hasJoined) {
    memberProfiles[user.email!] = userProfile;
  }

  const sortedMembers = [...people].sort((a, b) => b.score - a.score);

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
                Room Members ({hasJoined ? sortedMembers.length + 1 : sortedMembers.length})
              </h2>
            </div>

            {sortedMembers.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                No one else has joined yet. Be the first!
              </p>
            ) : (
              <div className="space-y-2">
                {hasJoined && userProfile && (
                  <MemberCard
                    profile={roomPersonToProfile({ email: user.email!, name: userProfile.displayName, score: 100, common_artists: userProfile.musicPreferences?.artists ?? [], verified: false }, true)}
                    isCurrentUser
                    compatibilityScore={undefined}
                    connectionStatus="none"
                  />
                )}
                {sortedMembers.map((person) => {
                  const profile = memberProfiles[person.email];
                  const isCurrentUser = person.email === userEmail;
                  const connectionStatus = isCurrentUser ? 'none' : getConnectionStatus(person.email);
                  const displayProfile: UserProfile = profile || roomPersonToProfile(person, isCurrentUser);

                  return (
                    <MemberCard
                      key={person.email}
                      profile={displayProfile}
                      isCurrentUser={isCurrentUser}
                      compatibilityScore={isCurrentUser ? undefined : person.score}
                      connectionStatus={connectionStatus}
                      onViewProfile={!isCurrentUser ? () => setProfileModalUser(displayProfile) : undefined}
                      onRequestConnection={
                        hasJoined && connectionStatus === 'none' && !isCurrentUser
                          ? () => handleRequestConnection(person.email)
                          : undefined
                      }
                    />
                  );
                })}
              </div>
            )}

            {!hasJoined && sortedMembers.length > 0 && (
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
            currentUserEmail={userEmail ?? undefined}
            memberProfiles={memberProfiles}
            disabled={!hasJoined}
            useBackend
          />
        </div>
      </div>

      <ProfileModal profile={profileModalUser} onClose={() => setProfileModalUser(null)} />
    </div>
  );
}
