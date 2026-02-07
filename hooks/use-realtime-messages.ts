'use client';

import { useEffect, useState } from 'react';
import { subscribeToRoomMessages, subscribeToThreadMessages } from '@/lib/firebase/firestore';
import type { RoomMessage, ThreadMessage } from '@/lib/types';

/**
 * Hook for subscribing to room messages in real-time
 */
export function useRoomMessages(concertId: string | null) {
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!concertId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToRoomMessages(concertId, (msgs) => {
      setMessages(msgs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [concertId]);

  return { messages, loading };
}

/**
 * Hook for subscribing to thread messages in real-time
 */
export function useThreadMessages(threadId: string | null) {
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!threadId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = subscribeToThreadMessages(threadId, (msgs) => {
      setMessages(msgs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [threadId]);

  return { messages, loading };
}
