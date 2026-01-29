import { type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { NextResponse } from 'next/server';

// Define public routes that don't require authentication
const publicRoutes = ['/', '/login', '/signup'];

// Define routes that should redirect to dashboard if already authenticated
const authRoutes = ['/login', '/signup'];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Update Supabase session
  const { supabaseResponse, user } = await updateSession(request);
  const isAuthenticated = !!user;

  // Check if the current route is public
  const isPublicRoute = publicRoutes.some(route => pathname === route);
  const isAuthRoute = authRoutes.some(route => pathname === route);

  // If user is authenticated and tries to access login/signup, redirect to dashboard
  if (isAuthenticated && isAuthRoute) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // If user is not authenticated and tries to access protected route, redirect to login
  if (!isAuthenticated && !isPublicRoute) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}

// Configure which routes to run proxy on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api/auth (authentication endpoints)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api/auth|_next/static|_next/image|favicon.ico|.*\\.svg|.*\\.png).*)',
  ],
};
