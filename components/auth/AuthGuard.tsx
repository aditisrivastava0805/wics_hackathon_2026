'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { Loading } from '@/components/ui/loading';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * AuthGuard - Redirects unauthenticated users to /login
 * Wrap protected routes with this component
 */
export function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loading size="lg" />
          <p className="mt-4 text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if not authenticated (redirect will happen)
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loading size="lg" />
          <p className="mt-4 text-gray-500">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
