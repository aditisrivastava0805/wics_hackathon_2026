'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
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
import { getUserProfile as getUserProfileAuth } from '@/lib/firebase/auth';
import { ProfileModal } from '@/components/profile/ProfileModal';
import { getInitials, formatTime } from '@/lib/utils';
import type { Thread, UserProfile, Concert, ThreadMessage, ChecklistItem } from '@/lib/types';
import { ArrowLeft, PartyPopper, Send, Plus, Check, Trash2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function ThreadDetailPage() {
  const params = useParams();
  const threadId = params.id as string;
  const { user } = useAuth();
  const [thread, setThread] = useState<Thread | null>(null);
  const [otherProfile, setOtherProfile] = useState<UserProfile | null>(null);
  const [concert, setConcert] = useState<Concert | null>(null);
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newItemTitle, setNewItemTitle] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profileModal, setProfileModal] = useState<UserProfile | null>(null);
  const [goingTogetherLoading, setGoingTogetherLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const otherUid = thread && user?.uid
    ? (thread.participants[0] === user.uid ? thread.participants[1] : thread.participants[0])
    : null;
  const myGoing = thread?.goingTogether?.[user?.uid ?? ''] ?? false;
  const theirGoing = otherUid ? (thread?.goingTogether?.[otherUid] ?? false) : false;
  const bothGoing = myGoing && theirGoing;

  // Load thread, then other profile and concert
  useEffect(() => {
    if (!threadId || !user?.uid) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const t = await getThread(threadId);
        if (cancelled) return;
        if (!t) {
          setError('Thread not found');
          setThread(null);
          setLoading(false);
          return;
        }
        setThread(t);
        const otherUidResolved = t.participants[0] === user.uid ? t.participants[1] : t.participants[0];
        const [profile, concertRes] = await Promise.all([
          getUserProfileAuth(otherUidResolved),
          t.concertId ? getConcert(t.concertId) : null,
        ]);
        if (cancelled) return;
        setOtherProfile(profile ?? null);
        setConcert(concertRes ?? null);
      } catch (err) {
        if (!cancelled) setError('Failed to load thread');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [threadId, user?.uid]);

  // Subscribe to messages
  useEffect(() => {
    if (!threadId) return;
    const unsub = subscribeToThreadMessages(threadId, setMessages);
    return () => unsub();
  }, [threadId]);

  // Load checklist
  const loadChecklist = useCallback(async () => {
    if (!threadId) return;
    const items = await getChecklistItems(threadId);
    setChecklist(items);
  }, [threadId]);

  useEffect(() => {
    loadChecklist();
  }, [loadChecklist]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user?.uid || !threadId || sending) return;
    setSending(true);
    try {
      await sendThreadMessage(threadId, user.uid, newMessage.trim());
      setNewMessage('');
    } catch (err) {
      console.error('Send failed:', err);
    } finally {
      setSending(false);
    }
  };

  const handleGoingTogether = async () => {
    if (!threadId || !user?.uid || goingTogetherLoading) return;
    setGoingTogetherLoading(true);
    try {
      await updateGoingTogether(threadId, user.uid, !myGoing);
      const updated = await getThread(threadId);
      if (updated) setThread(updated);
      if (!myGoing && theirGoing) {
        confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
      }
    } catch (err) {
      console.error('Going together update failed:', err);
    } finally {
      setGoingTogetherLoading(false);
    }
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemTitle.trim() || !user?.uid || !threadId) return;
    try {
      await createChecklistItem(threadId, newItemTitle.trim(), user.uid);
      setNewItemTitle('');
      await loadChecklist();
    } catch (err) {
      console.error('Add item failed:', err);
    }
  };

  const handleToggleItem = async (item: ChecklistItem) => {
    if (!threadId) return;
    try {
      await updateChecklistItem(threadId, item.id, { isCompleted: !item.isCompleted });
      await loadChecklist();
    } catch (err) {
      console.error('Toggle failed:', err);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!threadId) return;
    try {
      await deleteChecklistItem(threadId, itemId);
      await loadChecklist();
    } catch (err) {
      console.error('Delete failed:', err);
    }
  };

  const displayName = otherProfile?.displayName ?? 'Concert buddy';
  const concertLabel = concert?.name
    ? `${concert.name}${concert.venue ? ` @ ${concert.venue}` : ''}`
    : 'Concert';

  if (loading || !thread) {
    return (
      <div>
        <Link href="/threads" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft size={18} />
          <span>Back to Messages</span>
        </Link>
        <div className="bg-white rounded-xl border border-gray-200 p-8 animate-pulse">
          <div className="h-12 bg-gray-200 rounded w-1/3 mb-4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Link href="/threads" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
          <ArrowLeft size={18} />
          <span>Back to Messages</span>
        </Link>
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
          <p className="text-gray-600">{error}</p>
          <Link href="/threads" className="inline-block mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm">
            Back to Messages
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Link href="/threads" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
        <ArrowLeft size={18} />
        <span>Back to Messages</span>
      </Link>

      {/* Thread Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <button
            type="button"
            onClick={() => setProfileModal(otherProfile ?? null)}
            className="flex items-center gap-3 text-left hover:opacity-90"
          >
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-medium flex-shrink-0">
              {otherProfile?.avatarUrl ? (
                <img src={otherProfile.avatarUrl} alt={displayName} className="w-full h-full rounded-full object-cover" />
              ) : (
                getInitials(displayName)
              )}
            </div>
            <div>
              <p className="font-semibold text-gray-900">{displayName}</p>
              <p className="text-sm text-gray-500">{concertLabel}</p>
            </div>
          </button>
          <button
            onClick={handleGoingTogether}
            disabled={goingTogetherLoading}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 ${
              bothGoing
                ? 'bg-accent-100 text-accent-700'
                : myGoing
                  ? 'bg-yellow-100 text-yellow-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <PartyPopper size={18} />
            {bothGoing ? 'Going Together!' : myGoing ? 'Waiting for them...' : 'Going Together?'}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Private Chat */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl border border-gray-200 flex flex-col h-[450px]">
            <div className="p-4 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">Private Chat</h2>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <p className="text-gray-400 text-sm text-center py-8">No messages yet. Say hi!</p>
              ) : (
                messages.map((msg) => {
                  const isMe = msg.senderId === user?.uid;
                  return (
                    <div
                      key={msg.id}
                      className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-lg px-3 py-2 ${
                          isMe ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-900'
                        }`}
                      >
                        <p className="text-sm">{msg.content}</p>
                        {msg.createdAt && (
                          <p className={`text-xs mt-1 ${isMe ? 'text-primary-200' : 'text-gray-500'}`}>
                            {formatTime(msg.createdAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSend} className="p-4 border-t border-gray-200 flex gap-2">
              <input
                type="text"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={sending}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
              <button
                type="submit"
                disabled={sending || !newMessage.trim()}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Send size={18} />
                Send
              </button>
            </form>
          </div>
        </div>

        {/* Checklist */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 mb-4">Coordination Checklist</h2>
            <div className="space-y-2 mb-4">
              {checklist.length === 0 ? (
                <p className="text-gray-500 text-sm">No items yet. Add one below.</p>
              ) : (
                checklist.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-50 group"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleItem(item)}
                      className="w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center hover:border-primary-500 flex-shrink-0"
                    >
                      {item.isCompleted && <Check size={12} className="text-green-500" />}
                    </button>
                    <span
                      className={`flex-1 text-sm ${
                        item.isCompleted ? 'text-gray-400 line-through' : 'text-gray-700'
                      }`}
                    >
                      {item.title}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(item.id)}
                      className="p-1 text-gray-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
            <form onSubmit={handleAddItem} className="flex gap-2">
              <input
                type="text"
                placeholder="Add item..."
                value={newItemTitle}
                onChange={(e) => setNewItemTitle(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
              />
              <button
                type="submit"
                disabled={!newItemTitle.trim()}
                className="p-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                title="Add"
              >
                <Plus size={18} />
              </button>
            </form>
          </div>

          {concert && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Concert</h3>
              <p className="text-sm text-gray-900 font-medium">{concert.name}</p>
              {concert.venue && <p className="text-sm text-gray-500">{concert.venue}</p>}
            </div>
          )}
        </div>
      </div>

      <ProfileModal profile={profileModal} onClose={() => setProfileModal(null)} />
    </div>
  );
}
