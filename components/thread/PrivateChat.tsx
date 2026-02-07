'use client';

import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { subscribeToThreadMessages, sendThreadMessage } from '@/lib/firebase/firestore';
import { formatTime, getInitials } from '@/lib/utils';
import type { ThreadMessage, UserProfile } from '@/lib/types';

interface PrivateChatProps {
  threadId: string;
  currentUserId: string;
  currentUserProfile: UserProfile | null;
  otherUserProfile: UserProfile;
}

/**
 * PrivateChat - Real-time private messaging for threads
 */
export function PrivateChat({
  threadId,
  currentUserId,
  currentUserProfile,
  otherUserProfile,
}: PrivateChatProps) {
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to messages
  useEffect(() => {
    if (!threadId) return;

    setLoading(true);
    const unsubscribe = subscribeToThreadMessages(threadId, (msgs) => {
      setMessages(msgs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [threadId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || !currentUserId) return;

    setSending(true);
    setError(null);

    try {
      await sendThreadMessage(threadId, currentUserId, newMessage.trim());
      setNewMessage('');
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const getProfile = (senderId: string) => {
    if (senderId === currentUserId) return currentUserProfile;
    return otherUserProfile;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-[450px]">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">Private Chat</h2>
        <p className="text-xs text-gray-500">Only you and {otherUserProfile.displayName} can see these messages</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm text-center">
              No messages yet.<br />
              Say hi to {otherUserProfile.displayName}!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const profile = getProfile(msg.senderId);
            const isOwn = msg.senderId === currentUserId;

            return (
              <div
                key={msg.id}
                className={`flex gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}
              >
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-xs font-medium flex-shrink-0">
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

                {/* Message bubble */}
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                    isOwn
                      ? 'bg-primary-600 text-white rounded-br-md'
                      : 'bg-gray-100 text-gray-900 rounded-bl-md'
                  }`}
                >
                  <p className="text-sm break-words">{msg.content}</p>
                  <p className={`text-xs mt-1 ${
                    isOwn ? 'text-primary-200' : 'text-gray-400'
                  }`}>
                    {msg.createdAt ? formatTime(msg.createdAt) : 'Just now'}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t border-gray-200">
        {error && (
          <p className="text-xs text-red-500 mb-2">{error}</p>
        )}
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="p-2 bg-primary-600 text-white rounded-full hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </div>
      </form>
    </div>
  );
}
