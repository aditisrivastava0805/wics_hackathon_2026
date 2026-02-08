'use client';

import { useAuth } from '@/context/auth-context';
import { signOut } from '@/lib/firebase/auth';
import { ShieldX } from 'lucide-react';

interface UTEmailGuardProps {
  children: React.ReactNode;
}

const UT_EMAIL_DOMAIN = '@utexas.edu';

/**
 * UTEmailGuard - Blocks users without @utexas.edu email
 */
export function UTEmailGuard({ children }: UTEmailGuardProps) {
  const { user } = useAuth();

  const isValidUTEmail = user?.email?.toLowerCase().endsWith(UT_EMAIL_DOMAIN);

  if (!isValidUTEmail) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldX className="w-8 h-8 text-red-600" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Access Restricted
          </h1>

          <p className="text-gray-600 mb-4">
            Encore is only available to UT Austin students.
          </p>

          <p className="text-sm text-gray-500 mb-6">
            You&apos;re signed in as <span className="font-medium">{user?.email}</span>,
            which is not a <span className="font-medium">@utexas.edu</span> email address.
          </p>

          <button
            onClick={() => signOut()}
            className="w-full py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
          >
            Sign Out
          </button>

          <p className="mt-4 text-xs text-gray-400">
            Please sign up with your UT Austin email to access Encore.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
