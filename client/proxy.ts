import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  // Check if the user is requesting a dashboard route
  if (pathname.startsWith('/dashboard')) {
    // If no token exists, redirect to login
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
  }

  // Check if a logged-in user is trying to access auth pages
  if (pathname === '/login' || pathname === '/register') {
    if (token) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

// Configure which paths the proxy runs on
export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
