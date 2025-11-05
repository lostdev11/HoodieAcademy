import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const url = request.nextUrl.clone();
  const hostname = request.headers.get('host') || '';
  
  // Skip ALL redirects for localhost/development - allow HTTP to work
  if (hostname.includes('localhost') || 
      hostname.includes('127.0.0.1') || 
      hostname.includes('0.0.0.0') ||
      hostname.startsWith('localhost:') ||
      hostname.startsWith('127.0.0.1:')) {
    return NextResponse.next();
  }
  
  // Check actual protocol from forwarded headers (for reverse proxies like Vercel)
  // This is critical for mobile devices and proper HTTPS detection
  // When behind a reverse proxy, x-forwarded-proto is the source of truth
  const forwardedProto = request.headers.get('x-forwarded-proto');
  
  // Determine if request is HTTPS:
  // 1. If x-forwarded-proto exists, trust it (this is set by Vercel/load balancers)
  // 2. Otherwise, check url.protocol (for direct connections)
  const isHttps = forwardedProto 
    ? forwardedProto === 'https'
    : url.protocol === 'https:';
  
  // Normalize to non-www (only for production)
  // Only redirect if we're not already on the non-www version
  if (hostname.startsWith('www.') && process.env.NODE_ENV === 'production') {
    const nonWwwHostname = hostname.replace('www.', '');
    url.hostname = nonWwwHostname;
    url.protocol = 'https:';
    return NextResponse.redirect(url, 301); // Permanent redirect
  }
  
  // Redirect HTTP to HTTPS (only in production)
  // Check both forwarded header and URL protocol to avoid redirect loops
  // Also ensure we're not already on HTTPS to prevent loops
  if (!isHttps && process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
    url.protocol = 'https:';
    return NextResponse.redirect(url, 301); // Permanent redirect
  }
  
  // Add security headers for mobile browser compatibility
  const response = NextResponse.next();
  
  // Ensure proper headers for Phantom mobile
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  
  return response;
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
