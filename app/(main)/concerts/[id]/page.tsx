'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import {
  getConcert,
  getRoomMembers,
  subscribeToRoomMessages,
  sendRoomMessage,
} from '@/lib/firebase/firestore';
import { getUserProfile } from '@/lib/firebase/auth';
import { useAuth } from '@/context/auth-context';
import { formatDate, formatTime, getInitials } from '@/lib/utils';
import type { Concert, RoomMember, RoomMessage, UserProfile } from '@/lib/types';
import { Calendar, MapPin, Send, UserPlus } from 'lucide-react';

export default function ConcertRoomPage() {
  const params = useParams();
  const concertId = params.id as string;
  const { user, userProfile } = useAuth();

  const [concert, setConcert] = useState<Concert | null>(null);
  const [members, setMembers] = useState<(RoomMember & { profile?: UserProfile })[]>([]);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [memberProfiles, setMemberProfiles] = useState<Record<string, UserProfile>>({});
  const [newMessage, setNewMessage] = useState('');
  const [hasJoined, setHasJoined] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load concert data
  useEffect(() => {
    async function load() {
      try {
        const [concertData, membersData] = await Promise.all([
          getConcert(concertId),
          getRoomMembers(concertId),
        ]);
        setConcert(concertData);
        setMembers(membersData);
        
        // Check if current user has joined
        if (user) {
          setHasJoined(membersData.some((m) => m.userId === user.uid));
        }

        // Load member profiles
        const profiles: Record<string, UserProfile> = {};
        for (const member of membersData) {
          const profile = await getUserProfile(member.userId);
          if (profile) {
            profiles[member.userId] = profile;
          }
        }
        setMemberProfiles(profiles);
      } catch (err) {
        console.error('Failed to load concert room:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [concertId, user]);

  // Subscribe to messages
  useEffect(() => {
    if (!hasJoined) return;

    const unsubscribe = subscribeToRoomMessages(concertId, (msgs) => {
      setMessages(msgs);
    });

    return () => unsubscribe();
  }, [concertId, hasJoined]);

  const handleJoin = async () => {
    if (!user) return;

    try {
      const memberRef = doc(db, 'concerts', concertId, 'members', user.uid);
      await setDoc(memberRef, {
        userId: user.uid,
        joinedAt: serverTimestamp(),
      });
      setHasJoined(true);

      // Refresh members
      const membersData = await getRoomMembers(concertId);
      setMembers(membersData);
    } catch (err) {
      console.error('Failed to join room:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim()) return;

    try {
      await sendRoomMessage(concertId, user.uid, newMessage.trim());
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!concert) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Concert not found</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Concert header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">{concert.name}</h1>
        <p className="text-lg text-primary-600 font-medium mb-4">{concert.artist}</p>
        
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar size={16} />
            <span>{formatDate(concert.date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={16} />
            <span>{concert.venue}</span>
          </div>
        </div>

        {!hasJoined && (
          <button
            onClick={handleJoin}
            className="mt-4 px-6 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Join This Room
          </button>
        )}
      </div>

      {hasJoined && (
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Members section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
              <h2 className="font-semibold text-gray-900 mb-4">
                Room Members ({members.length})
              </h2>
              
              <div className="space-y-3">
                {members.map((member) => {
                  const profile = memberProfiles[member.userId];
                  const isCurrentUser = member.userId === user?.uid;
                  
                  return (
                    <div
                      key={member.id}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50"
                    >
                      <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
                        {profile?.avatarUrl ? (
                          <img
                            src={profile.avatarUrl}
                            alt={profile.displayName}
                            className="w-full h-full rounded-full object-cover"
                          />
                        ) : (
                          getInitials(profile?.displayName || 'U')
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">
                          {profile?.displayName || 'User'}
                          {isCurrentUser && (
                            <span className="text-xs text-gray-500 ml-1">(you)</span>
                          )}
                        </p>
                        {profile?.musicPreferences?.genres && (
                          <p className="text-xs text-gray-500 truncate">
                            {profile.musicPreferences.genres.slice(0, 2).join(', ')}
                          </p>
                        )}
                      </div>
                      {!isCurrentUser && (
                        <button
                          className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                          title="Request connection"
                        >
                          <UserPlus size={18} />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Chat section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[500px]">
              <div className="p-4 border-b border-gray-200">
                <h2 className="font-semibold text-gray-900">Room Chat</h2>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">
                    No messages yet. Start the conversation!
                  </p>
                ) : (
                  messages.map((msg) => {
                    const profile = memberProfiles[msg.userId];
                    const isOwn = msg.userId === user?.uid;

                    return (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                      >
                        <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-sm font-medium flex-shrink-0">
                          {getInitials(profile?.displayName || 'U')}
                        </div>
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 ${
                            isOwn
                              ? 'bg-primary-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          {!isOwn && (
                            <p className="text-xs font-medium mb-1 opacity-70">
                              {profile?.displayName || 'User'}
                            </p>
                          )}
                          <p>{msg.content}</p>
                          <p className={`text-xs mt-1 ${isOwn ? 'opacity-70' : 'text-gray-500'}`}>
                            {formatTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Input */}
              <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
