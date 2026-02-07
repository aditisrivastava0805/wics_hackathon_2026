'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import confetti from 'canvas-confetti';
import {
  getThread,
  getConcert,
  subscribeToThreadMessages,
  sendThreadMessage,
  updateGoingTogether,
  getChecklistItems,
  createChecklistItem,
  updateChecklistItem,
  deleteChecklistItem,
} from '@/lib/firebase/firestore';
import { getUserProfile } from '@/lib/firebase/auth';
import { useAuth } from '@/context/auth-context';
import { getInitials, formatTime, formatDate } from '@/lib/utils';
import type { Thread, ThreadMessage, UserProfile, Concert, ChecklistItem } from '@/lib/types';
import { Send, PartyPopper, Plus, Trash2, Check } from 'lucide-react';

export default function ThreadPage() {
  const params = useParams();
  const threadId = params.id as string;
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [thread, setThread] = useState<Thread | null>(null);
  const [concert, setConcert] = useState<Concert | null>(null);
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [loading, setLoading] = useState(true);
  const [prevGoingTogether, setPrevGoingTogether] = useState(false);

  // Load thread data
  useEffect(() => {
    async function load() {
      try {
        const threadData = await getThread(threadId);
        if (!threadData) return;

        setThread(threadData);

        const [concertData, checklistData] = await Promise.all([
          getConcert(threadData.concertId),
          getChecklistItems(threadId),
        ]);
        setConcert(concertData);
        setChecklist(checklistData);

        // Get other user profile
        if (user) {
          const otherUserId = threadData.participants.find((p) => p !== user.uid);
          if (otherUserId) {
            const profile = await getUserProfile(otherUserId);
            setOtherUser(profile);
          }
        }
      } catch (err) {
        console.error('Failed to load thread:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [threadId, user]);

  // Subscribe to messages
  useEffect(() => {
    const unsubscribe = subscribeToThreadMessages(threadId, (msgs) => {
      setMessages(msgs);
    });
    return () => unsubscribe();
  }, [threadId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Check for "Going Together" celebration
  useEffect(() => {
    if (!thread || !user) return;

    const otherUserId = thread.participants.find((p) => p !== user.uid);
    const bothConfirmed =
      thread.goingTogether[user.uid] && otherUserId && thread.goingTogether[otherUserId];

    if (bothConfirmed && !prevGoingTogether) {
      // Trigger confetti!
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
    }

    setPrevGoingTogether(!!bothConfirmed);
  }, [thread, user, prevGoingTogether]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage.trim()) return;

    try {
      await sendThreadMessage(threadId, user.uid, newMessage.trim());
      setNewMessage('');
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const handleToggleGoingTogether = async () => {
    if (!user || !thread) return;

    const currentValue = thread.goingTogether[user.uid] || false;
    try {
      await updateGoingTogether(threadId, user.uid, !currentValue);
      setThread((prev) =>
        prev
          ? {
              ...prev,
              goingTogether: {
                ...prev.goingTogether,
                [user.uid]: !currentValue,
              },
            }
          : null
      );
    } catch (err) {
      console.error('Failed to update going together:', err);
    }
  };

  const handleAddChecklistItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newChecklistItem.trim()) return;

    try {
      const itemId = await createChecklistItem(threadId, newChecklistItem.trim(), user.uid);
      setChecklist((prev) => [
        ...prev,
        {
          id: itemId,
          title: newChecklistItem.trim(),
          isCompleted: false,
          assignedTo: null,
          createdBy: user.uid,
          createdAt: { toDate: () => new Date() } as any,
          updatedAt: { toDate: () => new Date() } as any,
        },
      ]);
      setNewChecklistItem('');
    } catch (err) {
      console.error('Failed to add checklist item:', err);
    }
  };

  const handleToggleChecklistItem = async (item: ChecklistItem) => {
    try {
      await updateChecklistItem(threadId, item.id, { isCompleted: !item.isCompleted });
      setChecklist((prev) =>
        prev.map((i) => (i.id === item.id ? { ...i, isCompleted: !i.isCompleted } : i))
      );
    } catch (err) {
      console.error('Failed to toggle checklist item:', err);
    }
  };

  const handleDeleteChecklistItem = async (itemId: string) => {
    try {
      await deleteChecklistItem(threadId, itemId);
      setChecklist((prev) => prev.filter((i) => i.id !== itemId));
    } catch (err) {
      console.error('Failed to delete checklist item:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">Thread not found</h2>
      </div>
    );
  }

  const otherUserId = thread.participants.find((p) => p !== user?.uid);
  const isGoingTogether =
    user &&
    thread.goingTogether[user.uid] &&
    otherUserId &&
    thread.goingTogether[otherUserId];
  const userConfirmed = user && thread.goingTogether[user.uid];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-medium">
              {getInitials(otherUser?.displayName || 'U')}
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {otherUser?.displayName || 'User'}
              </p>
              <p className="text-sm text-gray-500">{concert?.name || 'Concert'}</p>
            </div>
          </div>

          <button
            onClick={handleToggleGoingTogether}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
              isGoingTogether
                ? 'bg-accent-500 text-white'
                : userConfirmed
                ? 'bg-accent-100 text-accent-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <PartyPopper size={18} />
            {isGoingTogether
              ? 'Going Together!'
              : userConfirmed
              ? 'Waiting for them...'
              : 'Going Together?'}
          </button>
        </div>

        {isGoingTogether && (
          <div className="mt-4 p-3 bg-accent-50 border border-accent-200 rounded-lg text-center">
            <p className="text-accent-700 font-medium">
              You&apos;re both going together! Have an amazing time!
            </p>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Messages */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col h-[500px]">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Chat</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  Start your conversation!
                </p>
              ) : (
                messages.map((msg) => {
                  const isOwn = msg.senderId === user?.uid;
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${isOwn ? 'flex-row-reverse' : ''}`}
                    >
                      <div
                        className={`max-w-[70%] rounded-lg px-4 py-2 ${
                          isOwn
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p>{msg.content}</p>
                        <p
                          className={`text-xs mt-1 ${
                            isOwn ? 'opacity-70' : 'text-gray-500'
                          }`}
                        >
                          {formatTime(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

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

        {/* Checklist */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-4">Coordination Checklist</h2>

            <div className="space-y-2 mb-4">
              {checklist.length === 0 ? (
                <p className="text-sm text-gray-500 py-4 text-center">
                  No items yet. Add something to coordinate!
                </p>
              ) : (
                checklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 group"
                  >
                    <button
                      onClick={() => handleToggleChecklistItem(item)}
                      className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                        item.isCompleted
                          ? 'bg-green-500 border-green-500 text-white'
                          : 'border-gray-300 hover:border-primary-500'
                      }`}
                    >
                      {item.isCompleted && <Check size={12} />}
                    </button>
                    <span
                      className={`flex-1 text-sm ${
                        item.isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'
                      }`}
                    >
                      {item.title}
                    </span>
                    <button
                      onClick={() => handleDeleteChecklistItem(item.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 text-red-500 hover:bg-red-50 rounded"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddChecklistItem} className="flex gap-2">
              <input
                type="text"
                value={newChecklistItem}
                onChange={(e) => setNewChecklistItem(e.target.value)}
                placeholder="Add item..."
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <button
                type="submit"
                disabled={!newChecklistItem.trim()}
                className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
              >
                <Plus size={18} />
              </button>
            </form>

            {concert && (
              <div className="mt-6 pt-4 border-t border-gray-200">
                <h3 className="text-sm font-medium text-gray-700 mb-2">Concert Details</h3>
                <p className="text-sm text-gray-600">{concert.name}</p>
                <p className="text-sm text-gray-500">{concert.venue}</p>
                <p className="text-sm text-gray-500">{formatDate(concert.date)}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
