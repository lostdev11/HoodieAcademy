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
  const forwardedProto = request.headers.get('x-forwarded-proto');
  
  // Only do redirects in production
  if (process.env.NODE_ENV === 'production') {
    // Normalize to non-www - only redirect www to non-www
    if (hostname.startsWith('www.')) {
      const nonWwwHostname = hostname.replace('www.', '');
      url.hostname = nonWwwHostname;
      url.protocol = 'https:';
      return NextResponse.redirect(url, 301);
    }
    
    // If we're already on HTTPS (confirmed by forwarded header), skip HTTP redirect check
    if (forwardedProto === 'https') {
      // Already on HTTPS, no redirect needed - just continue
      const response = NextResponse.next();
      response.headers.set('X-Content-Type-Options', 'nosniff');
      response.headers.set('X-Frame-Options', 'SAMEORIGIN');
      return response;
    }
    
    // Redirect HTTP to HTTPS - only if we're absolutely certain it's HTTP
    // Check forwarded header first (most reliable), then fall back to URL protocol
    if (forwardedProto === 'http') {
      // Definitely HTTP, redirect to HTTPS
      url.protocol = 'https:';
      return NextResponse.redirect(url, 301);
    } else if (forwardedProto === null && url.protocol === 'http:') {
      // No forwarded header but URL is HTTP, redirect to HTTPS
      url.protocol = 'https:';
      return NextResponse.redirect(url, 301);
    }
    // If url.protocol is 'https:', we're already on HTTPS, no redirect needed
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
