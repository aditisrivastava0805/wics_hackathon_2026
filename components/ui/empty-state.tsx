'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { 
  Music, 
  Users, 
  MessageSquare, 
  Search, 
  Inbox,
  type LucideIcon 
} from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

/**
 * EmptyState - Reusable empty state component
 */
export function EmptyState({ 
  icon: Icon = Inbox, 
  title, 
  description, 
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn(
      'bg-white rounded-xl border border-gray-200 p-8 sm:p-12 text-center',
      className
    )}>
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      {description && (
        <p className="text-gray-500 mb-6 max-w-sm mx-auto">
          {description}
        </p>
      )}
      {action && (
        <div className="flex justify-center">
          {action}
        </div>
      )}
    </div>
  );
}

// Pre-configured empty states for common scenarios

export function EmptyStateConcerts({ onRefresh }: { onRefresh?: () => void }) {
  return (
    <EmptyState
      icon={Music}
      title="No concerts found"
      description="There are no upcoming concerts in the database yet. Check back soon!"
      action={onRefresh && (
        <button
          onClick={onRefresh}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          Refresh
        </button>
      )}
    />
  );
}

export function EmptyStateMembers() {
  return (
    <EmptyState
      icon={Users}
      title="No one here yet"
      description="Be the first to join this concert room and start connecting with others!"
    />
  );
}

export function EmptyStateConnections() {
  return (
    <EmptyState
      icon={Users}
      title="No connections yet"
      description="Join a concert room and connect with others who share your music taste!"
    />
  );
}

export function EmptyStateMessages() {
  return (
    <EmptyState
      icon={MessageSquare}
      title="No messages yet"
      description="When someone accepts your connection request, a private thread will appear here."
    />
  );
}

export function EmptyStateSearch({ query }: { query: string }) {
  return (
    <EmptyState
      icon={Search}
      title="No results found"
      description={`We couldn't find anything matching "${query}". Try a different search.`}
    />
  );
}
