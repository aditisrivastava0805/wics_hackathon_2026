'use client';

import { useState, useEffect, useRef } from 'react';
import { Send } from 'lucide-react';
import { subscribeToRoomMessages, sendRoomMessage } from '@/lib/firebase/firestore';
import { formatTime, getInitials } from '@/lib/utils';
import type { RoomMessage, UserProfile } from '@/lib/types';

interface RoomChatProps {
  concertId: string;
  currentUserId: string;
  memberProfiles: Record<string, UserProfile>;
  disabled?: boolean;
}

/**
 * RoomChat - Real-time chat for concert rooms
 */
export function RoomChat({
  concertId,
  currentUserId,
  memberProfiles,
  disabled = false,
}: RoomChatProps) {
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sendError, setSendError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Subscribe to messages
  useEffect(() => {
    if (!concertId) return;
    
    setLoading(true);
    console.log('Subscribing to room messages:', concertId);
    
    const unsubscribe = subscribeToRoomMessages(concertId, (msgs) => {
      console.log('Received messages:', msgs.length);
      setMessages(msgs);
      setLoading(false);
    });

    return () => {
      console.log('Unsubscribing from room messages');
      unsubscribe();
    };
  }, [concertId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending || disabled || !currentUserId) return;

    setSending(true);
    setSendError(null);
    
    try {
      console.log('Sending message:', { concertId, currentUserId, content: newMessage.trim() });
      await sendRoomMessage(concertId, currentUserId, newMessage.trim());
      console.log('Message sent successfully');
      setNewMessage('');
    } catch (err: any) {
      console.error('Failed to send message:', err);
      setSendError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-[450px]">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="font-semibold text-gray-900">Room Chat</h2>
        <p className="text-xs text-gray-500">Public chat with all room members</p>
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
              Be the first to say hi!
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const profile = memberProfiles[msg.userId];
            const isOwn = msg.userId === currentUserId;

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
                  className={`max-w-[70%] rounded-lg px-3 py-2 ${
                    isOwn
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {!isOwn && (
                    <p className={`text-xs font-medium mb-0.5 ${
                      isOwn ? 'text-primary-200' : 'text-gray-500'
                    }`}>
                      {profile?.displayName || 'User'}
                    </p>
                  )}
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
        {sendError && (
          <p className="text-xs text-red-500 mb-2">{sendError}</p>
        )}
        {disabled ? (
          <p className="text-sm text-gray-500 text-center">
            Join the room to chat
          </p>
        ) : (
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
              disabled={!newMessage.trim() || sending}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
