import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { Timestamp } from 'firebase/firestore';

/**
 * Merge Tailwind CSS classes with clsx
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a Firestore Timestamp to a readable date string
 */
export function formatDate(timestamp: Timestamp | null | undefined): string {
  if (!timestamp) return '';
  
  const date = timestamp.toDate();
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format a Firestore Timestamp to a readable time string
 */
export function formatTime(timestamp: Timestamp | null | undefined): string {
  if (!timestamp) return '';
  
  const date = timestamp.toDate();
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

/**
 * Format a Firestore Timestamp to relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(timestamp: Timestamp | null | undefined): string {
  if (!timestamp) return '';
  
  const date = timestamp.toDate();
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return formatDate(timestamp);
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Generate initials from a display name
 */
export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/**
 * Validate UT email
 */
export function isValidUTEmail(email: string): boolean {
  return email.toLowerCase().endsWith('@utexas.edu');
}
