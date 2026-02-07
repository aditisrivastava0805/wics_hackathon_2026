'use client';

import Link from 'next/link';
import { Calendar, MapPin, DollarSign } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type { Concert } from '@/lib/types';

interface ConcertCardProps {
  concert: Concert;
  matchScore?: number;
}

/**
 * ConcertCard - Displays a concert with image, details, and optional match score
 */
export function ConcertCard({ concert, matchScore }: ConcertCardProps) {
  return (
    <Link
      href={`/concerts/${concert.id}`}
      className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md hover:border-gray-300 transition-all"
    >
      {/* Image */}
      <div className="aspect-video bg-gray-100 relative overflow-hidden">
        {concert.imageUrl ? (
          <img
            src={concert.imageUrl}
            alt={concert.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-400 text-sm">No image</span>
          </div>
        )}
        
        {/* Match score badge */}
        {matchScore !== undefined && matchScore > 50 && (
          <div className="absolute top-2 right-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              matchScore >= 80 
                ? 'bg-green-500 text-white' 
                : matchScore >= 65 
                  ? 'bg-yellow-500 text-white'
                  : 'bg-gray-500 text-white'
            }`}>
              {matchScore}% match
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 group-hover:text-primary-600 transition-colors">
          {concert.name}
        </h3>
        <p className="text-primary-600 font-medium text-sm mb-3">
          {concert.artist}
        </p>

        <div className="space-y-1.5 text-sm text-gray-600">
          <div className="flex items-center gap-2">
            <Calendar size={14} className="text-gray-400 flex-shrink-0" />
            <span>{formatDate(concert.date)}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin size={14} className="text-gray-400 flex-shrink-0" />
            <span className="truncate">{concert.venue}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign size={14} className="text-gray-400 flex-shrink-0" />
            <span>{concert.priceRange}</span>
          </div>
        </div>

        {/* Genre tag */}
        <div className="mt-3">
          <span className="inline-block px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
            {concert.genre}
          </span>
        </div>
      </div>
    </Link>
  );
}

/**
 * ConcertCardSkeleton - Loading placeholder for ConcertCard
 */
export function ConcertCardSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
      {/* Image skeleton */}
      <div className="aspect-video bg-gray-200" />
      
      {/* Content skeleton */}
      <div className="p-4">
        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4" />
        
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-2/3" />
          <div className="h-3 bg-gray-200 rounded w-1/2" />
          <div className="h-3 bg-gray-200 rounded w-1/3" />
        </div>
        
        <div className="mt-3">
          <div className="h-5 bg-gray-200 rounded-full w-16" />
        </div>
      </div>
    </div>
  );
}
