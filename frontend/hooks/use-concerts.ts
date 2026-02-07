'use client';

import { useEffect, useState } from 'react';
import { getConcerts, getConcert } from '@/lib/firebase/firestore';
import { sortConcertsByPreference } from '@/lib/matching';
import { useAuth } from '@/context/auth-context';
import type { Concert } from '@/lib/types';

/**
 * Hook for fetching all concerts, sorted by user preferences
 */
export function useConcerts() {
  const { userProfile } = useAuth();
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getConcerts();
        
        if (userProfile) {
          setConcerts(sortConcertsByPreference(data, userProfile));
        } else {
          setConcerts(data);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }
    
    load();
  }, [userProfile]);

  return { concerts, loading, error };
}

/**
 * Hook for fetching a single concert by ID
 */
export function useConcert(concertId: string | null) {
  const [concert, setConcert] = useState<Concert | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!concertId) {
      setConcert(null);
      setLoading(false);
      return;
    }

    async function load() {
      try {
        setLoading(true);
        const data = await getConcert(concertId);
        setConcert(data);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }
    
    load();
  }, [concertId]);

  return { concert, loading, error };
}
