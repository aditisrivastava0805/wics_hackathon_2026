'use client';

import { ReactNode } from 'react';
import { AuthProvider } from '@/context/auth-context';
import { ToastProvider } from '@/components/ui/toast';

/**
 * Providers - Wraps all client-side providers
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </AuthProvider>
  );
}
