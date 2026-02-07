'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { getConcerts } from '@/lib/firebase/firestore';
import { sortConcertsByPreference, calculateConcertMatchScore } from '@/lib/matching';
import { ConcertCard, ConcertCardSkeleton } from '@/components/concerts/ConcertCard';
import type { Concert } from '@/lib/types';
import { Music, RefreshCw, AlertCircle } from 'lucide-react';

export default function ConcertsPage() {
  const { userProfile } = useAuth();
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConcerts = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getConcerts();
      
      // Sort by user preferences if profile exists
      if (userProfile && userProfile.musicPreferences) {
        setConcerts(sortConcertsByPreference(data, userProfile));
      } else {
        setConcerts(data);
      }
    } catch (err) {
      console.error('Failed to load concerts:', err);
      setError('Failed to load concerts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConcerts();
  }, [userProfile]);

  // Calculate match scores for display
  const getMatchScore = (concert: Concert): number | undefined => {
    if (!userProfile || !userProfile.musicPreferences) return undefined;
    return calculateConcertMatchScore(userProfile, concert);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Discover Concerts</h1>
        <p className="text-gray-500 mt-1">
          {userProfile?.musicPreferences?.genres?.length 
            ? 'Sorted by your music preferences'
            : 'Complete your profile to get personalized recommendations'}
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 flex-1">{error}</p>
          <button
            onClick={loadConcerts}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            <RefreshCw size={14} />
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <ConcertCardSkeleton key={i} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && concerts.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Music className="w-8 h-8 text-gray-400" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            No concerts found
          </h2>
          <p className="text-gray-500 mb-4 max-w-sm mx-auto">
            There are no upcoming concerts in the database yet. 
            Check back soon or run the seed script to add sample concerts.
          </p>
          <button
            onClick={loadConcerts}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      )}

      {/* Concert Grid */}
      {!loading && !error && concerts.length > 0 && (
        <>
          {/* Results count */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {concerts.length} concert{concerts.length !== 1 ? 's' : ''} found
            </p>
            <button
              onClick={loadConcerts}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {concerts.map((concert) => (
              <ConcertCard
                key={concert.id}
                concert={concert}
                matchScore={getMatchScore(concert)}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
