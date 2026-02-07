'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getConcerts } from '@/lib/firebase/firestore';
import { useAuth } from '@/context/auth-context';
import { sortConcertsByPreference } from '@/lib/matching';
import { formatDate } from '@/lib/utils';
import type { Concert, UserProfile } from '@/lib/types';
import { Calendar, MapPin, DollarSign } from 'lucide-react';

export default function ConcertsPage() {
  const { userProfile } = useAuth();
  const [concerts, setConcerts] = useState<Concert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConcerts() {
      try {
        const data = await getConcerts();
        // Sort by user preferences if profile exists
        if (userProfile) {
          setConcerts(sortConcertsByPreference(data, userProfile));
        } else {
          setConcerts(data);
        }
      } catch (err) {
        console.error('Failed to load concerts:', err);
      } finally {
        setLoading(false);
      }
    }
    loadConcerts();
  }, [userProfile]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (concerts.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No concerts yet</h2>
        <p className="text-gray-600">Check back soon for upcoming events!</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Discover Concerts</h1>
      
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {concerts.map((concert) => (
          <Link
            key={concert.id}
            href={`/concerts/${concert.id}`}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
          >
            {concert.imageUrl && (
              <div className="aspect-video bg-gray-100">
                <img
                  src={concert.imageUrl}
                  alt={concert.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 mb-1">{concert.name}</h3>
              <p className="text-primary-600 font-medium mb-3">{concert.artist}</p>
              
              <div className="space-y-1 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <Calendar size={14} />
                  <span>{formatDate(concert.date)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin size={14} />
                  <span>{concert.venue}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign size={14} />
                  <span>{concert.priceRange}</span>
                </div>
              </div>

              <div className="mt-3">
                <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                  {concert.genre}
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
