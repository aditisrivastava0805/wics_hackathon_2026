import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/concerts', '/connections', '/threads', '/profile'];

// Routes that should redirect to /concerts if already authenticated
const authRoutes = ['/login', '/signup'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check for Firebase auth cookie/token
  // Note: For full auth protection, you would need to verify the token server-side
  // This is a basic client-side redirect setup
  // The actual auth check happens in the (main)/layout.tsx component

  // For now, let all routes through and let client-side handle auth
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
