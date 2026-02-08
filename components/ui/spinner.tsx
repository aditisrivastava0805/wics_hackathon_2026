'use client';

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-6 h-6',
  lg: 'w-8 h-8',
  xl: 'w-12 h-12',
};

/**
 * Spinner - Consistent loading spinner using Lucide icon
 */
export function Spinner({ className, size = 'md' }: SpinnerProps) {
  return (
    <Loader2 
      className={cn('animate-spin text-primary-600', sizeClasses[size], className)} 
    />
  );
}

/**
 * SpinnerOverlay - Full page loading overlay
 */
export function SpinnerOverlay({ message }: { message?: string }) {
  return (
    <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="text-center">
        <Spinner size="xl" />
        {message && (
          <p className="mt-4 text-gray-600 font-medium">{message}</p>
        )}
      </div>
    </div>
  );
}

/**
 * SpinnerInline - For inline loading states (e.g., in buttons)
 */
export function SpinnerInline({ className }: { className?: string }) {
  return <Spinner size="sm" className={cn('inline', className)} />;
}
