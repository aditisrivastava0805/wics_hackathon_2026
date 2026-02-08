'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { getThread, getConcert } from '@/lib/firebase/firestore';
import { getUserProfile } from '@/lib/firebase/auth';
import { PrivateChat } from '@/components/thread/PrivateChat';
import { GoingTogetherButton } from '@/components/thread/GoingTogetherButton';
import { Checklist } from '@/components/thread/Checklist';
import { ProfileModal } from '@/components/profile';
import { getInitials, formatDate } from '@/lib/utils';
import type { Thread, UserProfile, Concert, GoingTogether } from '@/lib/types';
import { ArrowLeft, AlertCircle, Calendar, MapPin, Music, Loader2 } from 'lucide-react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export default function ThreadPage() {
  const params = useParams();
  const router = useRouter();
  const threadId = params.id as string;
  const { user, userProfile } = useAuth();

  const [thread, setThread] = useState<Thread | null>(null);
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [concert, setConcert] = useState<Concert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Load thread data
  useEffect(() => {
    async function loadThread() {
      if (!user) return;

      setLoading(true);
      setError(null);

      try {
        // Fetch thread
        const threadData = await getThread(threadId);
        if (!threadData) {
          setError('Thread not found');
          setLoading(false);
          return;
        }

        // Check if user is a participant
        if (!threadData.participants.includes(user.uid)) {
          setError('You are not a participant in this thread');
          setLoading(false);
          return;
        }

        setThread(threadData);

        // Find the other participant
        const otherUserId = threadData.participants.find((p) => p !== user.uid);
        if (otherUserId) {
          const otherUserProfile = await getUserProfile(otherUserId);
          setOtherUser(otherUserProfile);
        }

        // Fetch concert info
        const concertData = await getConcert(threadData.concertId);
        setConcert(concertData);
      } catch (err) {
        console.error('Failed to load thread:', err);
        setError('Failed to load thread');
      } finally {
        setLoading(false);
      }
    }

    loadThread();
  }, [threadId, user]);

  // Subscribe to thread updates (for goingTogether status)
  useEffect(() => {
    if (!threadId) return;

    const threadRef = doc(db, 'threads', threadId);
    const unsubscribe = onSnapshot(threadRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data();
        setThread((prev) => prev ? {
          ...prev,
          goingTogether: data.goingTogether || {},
        } : null);
      }
    });

    return () => unsubscribe();
  }, [threadId]);

  // Loading state
  if (loading) {
    return (
      <div>
        <Link
          href="/threads"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={18} />
          <span>Back to Messages</span>
        </Link>

        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !thread || !otherUser) {
    return (
      <div>
        <Link
          href="/threads"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft size={18} />
          <span>Back to Messages</span>
        </Link>

        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            {error || 'Thread not found'}
          </h2>
          <Link
            href="/threads"
            className="inline-block mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg"
          >
            Back to Messages
          </Link>
        </div>
      </div>
    );
  }

  const bothGoingTogether = 
    thread.goingTogether[user?.uid || ''] && 
    thread.goingTogether[otherUser.id];

  return (
    <div>
      {/* Back button */}
      <Link
        href="/threads"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
      >
        <ArrowLeft size={18} />
        <span>Back to Messages</span>
      </Link>

      {/* Thread Header */}
      <div className={`rounded-xl border p-4 mb-6 ${
        bothGoingTogether 
          ? 'bg-gradient-to-r from-accent-50 to-primary-50 border-accent-200' 
          : 'bg-white border-gray-200'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <button 
            onClick={() => setShowProfileModal(true)}
            className="flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
          >
            {/* Avatar */}
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium flex-shrink-0">
              {otherUser.avatarUrl ? (
                otherUser.avatarUrl.length <= 4 && !/^https?:\/\//.test(otherUser.avatarUrl) ? (
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
            <div>
              <p className="font-semibold text-gray-900">{otherUser.displayName}</p>
              {concert && (
                <p className="text-sm text-gray-500">
                  {concert.artist} @ {concert.venue}
                </p>
              )}
              <p className="text-xs text-primary-600 mt-0.5">View profile</p>
            </div>
          </button>

          {/* Going Together Button */}
          <GoingTogetherButton
            threadId={threadId}
            currentUserId={user?.uid || ''}
            otherUserId={otherUser.id}
            goingTogether={thread.goingTogether || {}}
            otherUserName={otherUser.displayName.split(' ')[0]}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Chat Section */}
        <div className="lg:col-span-2">
          <PrivateChat
            threadId={threadId}
            currentUserId={user?.uid || ''}
            currentUserProfile={userProfile}
            otherUserProfile={otherUser}
          />
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {/* Checklist */}
          <Checklist
            threadId={threadId}
            currentUserId={user?.uid || ''}
          />

          {/* Concert Info */}
          {concert && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Concert Details
              </h3>
              
              {concert.imageUrl && (
                <div className="w-full h-24 rounded-lg overflow-hidden mb-3">
                  <img
                    src={concert.imageUrl}
                    alt={concert.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Music size={14} className="text-gray-400" />
                  <span className="text-gray-900 font-medium">{concert.artist}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <MapPin size={14} className="text-gray-400" />
                  <span className="text-gray-600">{concert.venue}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar size={14} className="text-gray-400" />
                  <span className="text-gray-600">{formatDate(concert.date)}</span>
                </div>
              </div>

              <Link
                href={`/concerts/${concert.id}`}
                className="mt-3 block text-center text-sm text-primary-600 hover:text-primary-700"
              >
                View Concert Room →
              </Link>
            </div>
          )}

          {/* Other User Info */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">
              About {otherUser.displayName.split(' ')[0]}
            </h3>
            
            {otherUser.bio && (
              <p className="text-sm text-gray-600 mb-3">{otherUser.bio}</p>
            )}

            {otherUser.musicPreferences?.genres && otherUser.musicPreferences.genres.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-3">
                {otherUser.musicPreferences.genres.slice(0, 4).map((genre) => (
                  <span
                    key={genre}
                    className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full"
                  >
                    {genre}
                  </span>
                ))}
              </div>
            )}

            <button
              onClick={() => setShowProfileModal(true)}
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              View full profile →
            </button>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      {showProfileModal && otherUser && (
        <ProfileModal
          userId={otherUser.id}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </div>
  );
}
