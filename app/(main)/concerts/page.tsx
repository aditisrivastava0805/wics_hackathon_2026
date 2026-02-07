'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/auth-context';
import { getConcerts, getUserJoinedConcerts } from '@/lib/firebase/firestore';
import { sortConcertsByPreference, calculateConcertMatchScore } from '@/lib/matching';
import { ConcertCard, ConcertCardSkeleton } from '@/components/concerts/ConcertCard';
import type { Concert } from '@/lib/types';
import { Music, RefreshCw, AlertCircle, Compass, Users } from 'lucide-react';

type TabType = 'discover' | 'my-rooms';

export default function ConcertsPage() {
  const { user, userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('discover');
  const [allConcerts, setAllConcerts] = useState<Concert[]>([]);
  const [joinedConcerts, setJoinedConcerts] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConcerts = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Fetch all concerts and joined concerts in parallel
      const [all, joined] = await Promise.all([
        getConcerts(),
        getUserJoinedConcerts(user.uid),
      ]);
      
      // Sort all concerts by user preferences if profile exists
      if (userProfile && userProfile.musicPreferences) {
        setAllConcerts(sortConcertsByPreference(all, userProfile));
      } else {
        setAllConcerts(all);
      }
      
      setJoinedConcerts(joined);
    } catch (err) {
      console.error('Failed to load concerts:', err);
      setError('Failed to load concerts. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConcerts();
  }, [user, userProfile]);

  // Get current concerts based on active tab
  const currentConcerts = activeTab === 'discover' ? allConcerts : joinedConcerts;

  // Calculate match scores for display
  const getMatchScore = (concert: Concert): number | undefined => {
    if (!userProfile || !userProfile.musicPreferences) return undefined;
    return calculateConcertMatchScore(userProfile, concert);
  };

  return (
    <div>
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Concerts</h1>
        <p className="text-gray-500 mt-1">
          {activeTab === 'discover' 
            ? (userProfile?.musicPreferences?.genres?.length 
                ? 'Sorted by your music preferences'
                : 'Complete your profile to get personalized recommendations')
            : 'Concert rooms you\'ve joined'}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('discover')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'discover'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Compass size={16} />
          Discover
          <span className={`px-1.5 py-0.5 text-xs rounded-full ${
            activeTab === 'discover' 
              ? 'bg-primary-100 text-primary-700' 
              : 'bg-gray-100 text-gray-600'
          }`}>
            {allConcerts.length}
          </span>
        </button>
        <button
          onClick={() => setActiveTab('my-rooms')}
          className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'my-rooms'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
        >
          <Users size={16} />
          My Rooms
          {joinedConcerts.length > 0 && (
            <span className={`px-1.5 py-0.5 text-xs rounded-full ${
              activeTab === 'my-rooms' 
                ? 'bg-primary-100 text-primary-700' 
                : 'bg-green-100 text-green-700'
            }`}>
              {joinedConcerts.length}
            </span>
          )}
        </button>
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

      {/* Empty State - Discover */}
      {!loading && !error && activeTab === 'discover' && currentConcerts.length === 0 && (
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

      {/* Empty State - My Rooms */}
      {!loading && !error && activeTab === 'my-rooms' && currentConcerts.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-primary-600" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            No rooms joined yet
          </h2>
          <p className="text-gray-500 mb-4 max-w-sm mx-auto">
            You haven&apos;t joined any concert rooms. Discover concerts and join rooms to connect with others!
          </p>
          <button
            onClick={() => setActiveTab('discover')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Compass size={16} />
            Discover Concerts
          </button>
        </div>
      )}

      {/* Concert Grid */}
      {!loading && !error && currentConcerts.length > 0 && (
        <>
          {/* Results count */}
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-gray-500">
              {currentConcerts.length} concert{currentConcerts.length !== 1 ? 's' : ''} 
              {activeTab === 'my-rooms' ? ' joined' : ' found'}
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
            {currentConcerts.map((concert) => (
              <ConcertCard
                key={concert.id}
                concert={concert}
                matchScore={getMatchScore(concert)}
                showJoinedBadge={activeTab === 'my-rooms'}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
