'use client';

import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { AlertCircle, RefreshCw, WifiOff, ServerCrash } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

/**
 * ErrorState - Reusable error state component
 */
export function ErrorState({ 
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div className={cn(
      'bg-white rounded-xl border border-red-200 p-8 sm:p-12 text-center',
      className
    )}>
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <AlertCircle className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      <p className="text-gray-500 mb-6 max-w-sm mx-auto">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      )}
    </div>
  );
}

/**
 * ErrorInline - Inline error message
 */
export function ErrorInline({ 
  message, 
  onRetry,
  className,
}: { 
  message: string; 
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div className={cn(
      'p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3',
      className
    )}>
      <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
      <p className="text-red-700 flex-1 text-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center gap-1 px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
        >
          <RefreshCw size={14} />
          Retry
        </button>
      )}
    </div>
  );
}

/**
 * NetworkError - For network-related errors
 */
export function NetworkError({ onRetry }: { onRetry?: () => void }) {
  return (
    <ErrorState
      title="Connection Problem"
      message="Unable to connect to the server. Please check your internet connection and try again."
      onRetry={onRetry}
    />
  );
}

/**
 * ServerError - For server-side errors
 */
export function ServerError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="bg-white rounded-xl border border-red-200 p-8 sm:p-12 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <ServerCrash className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        Server Error
      </h3>
      <p className="text-gray-500 mb-6 max-w-sm mx-auto">
        Something went wrong on our end. Our team has been notified. Please try again later.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
        >
          <RefreshCw size={16} />
          Try Again
        </button>
      )}
    </div>
  );
}

/**
 * NotFound - For 404-like states
 */
export function NotFound({ 
  title = 'Not Found',
  message = 'The page or resource you\'re looking for doesn\'t exist.',
  backHref = '/',
  backLabel = 'Go Home',
}: { 
  title?: string;
  message?: string;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-8 sm:p-12 text-center">
      <div className="text-6xl font-bold text-gray-200 mb-4">404</div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">
        {title}
      </h3>
      <p className="text-gray-500 mb-6 max-w-sm mx-auto">
        {message}
      </p>
      <a
        href={backHref}
        className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
      >
        {backLabel}
      </a>
    </div>
  );
}
