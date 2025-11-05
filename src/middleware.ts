import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';
  
  // Normalize to non-www and HTTPS
  // Redirect www to non-www
  if (hostname.startsWith('www.')) {
    const nonWwwHostname = hostname.replace('www.', '');
    url.hostname = nonWwwHostname;
    url.protocol = 'https:';
    return NextResponse.redirect(url, 301); // Permanent redirect
  }
  
  // Redirect HTTP to HTTPS (only if not already HTTPS)
  if (url.protocol === 'http:') {
    url.protocol = 'https:';
    return NextResponse.redirect(url, 301); // Permanent redirect
  }
  
  // TEMPORARILY DISABLED TO FIX ADMIN ACCESS
  // This middleware was causing infinite redirect loops
  // Admin routes are handled by the pages themselves now
  
  // Check if the request is for admin routes
  // if (request.nextUrl.pathname.startsWith('/admin') || 
  //     request.nextUrl.pathname.startsWith('/api/admin')) {
    
  //   // For API routes, we'll let them handle their own auth
  //   // For page routes, we'll redirect to login if not authenticated
  //   if (request.nextUrl.pathname.startsWith('/api/admin')) {
  //     // API routes - let them handle auth internally
  //     return NextResponse.next();
  //   }
    
  //   // For admin page routes, check if user is authenticated
  //   // Since we can't access wallet state in middleware, we'll redirect to a protected page
  //   // that will handle the admin check
  //   return NextResponse.redirect(new URL('/admin-auth-check', request.url));
  // }
  
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
