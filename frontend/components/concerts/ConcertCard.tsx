'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Calendar, MapPin, DollarSign } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { getDemoImageForConcert, isDemoImageMode, isLowQualityImageUrl } from '@/lib/demoImages';
import type { Concert } from '@/lib/types';

interface ConcertCardProps {
  concert: Concert;
  matchScore?: number;
}

/** Build concert room URL; only valid when id is present */
function concertRoomHref(concert: Concert): string | null {
  const id = concert?.id;
  if (id == null || String(id).trim() === '' || String(id) === 'undefined' || String(id) === 'null') return null;
  return `/concerts/${encodeURIComponent(String(id))}`;
}

/** Poster fallback when no suitable image (ticket-stub style). */
const FALLBACK_POSTER =
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800';

function getConcertImageSrc(concert: Concert): string {
  if (isDemoImageMode()) return getDemoImageForConcert(concert.id, concert.artist);
  if (concert.artistImageUrl?.trim()) return concert.artistImageUrl!.trim();
  const main = concert.imageUrl?.trim();
  if (main && !isLowQualityImageUrl(main)) return main;
  return FALLBACK_POSTER;
}

/**
 * ConcertCard - Displays a concert with image, details, and optional match score
 */
export function ConcertCard({ concert, matchScore }: ConcertCardProps) {
  const href = concertRoomHref(concert);
  const Wrapper = href ? Link : 'div';
  const wrapperProps = href ? { href } : {};

  return (
    <Wrapper
      {...wrapperProps}
      className="group bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md hover:border-gray-300 transition-all block"
    >
      {/* Image: demo mode → local <img>; else Next Image for remote URLs */}
      <div className="aspect-video bg-gray-100 relative overflow-hidden">
        {(() => {
          const src = getConcertImageSrc(concert);
          const isDemoLocal = src.startsWith('/demo/');
          if (isDemoLocal) {
            return (
              <img
                src={src}
                alt={concert.name}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            );
          }
          return (
            <Image
              src={src}
              alt={concert.name}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className="object-cover group-hover:scale-105 transition-transform duration-300"
            />
          );
        })()}
        
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
    </Wrapper>
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
