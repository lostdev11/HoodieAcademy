import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // TEMPORARILY DISABLED TO FIX ADMIN ACCESS
  // This middleware was causing infinite redirect loops
  return NextResponse.next();
  
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
  
  // return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/api/admin/:path*',
  ],
};
