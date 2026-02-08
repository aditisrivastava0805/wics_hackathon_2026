'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { UTEmailGuard } from '@/components/auth/UTEmailGuard';
import { signOut } from '@/lib/firebase/auth';
import { Home, Users, MessageSquare, User, LogOut } from 'lucide-react';

const navItems = [
  { href: '/concerts', label: 'Concerts', icon: Home },
  { href: '/connections', label: 'Connections', icon: Users },
  { href: '/threads', label: 'Messages', icon: MessageSquare },
  { href: '/profile', label: 'Profile', icon: User },
];

function MainLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/concerts" className="text-xl font-bold text-primary-600">
            Encore
          </Link>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-6xl mx-auto px-4 py-6 pb-24">
        {children}
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-around">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                  isActive
                    ? 'text-primary-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={20} />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <UTEmailGuard>
        <MainLayoutContent>{children}</MainLayoutContent>
      </UTEmailGuard>
    </AuthGuard>
  );
}
