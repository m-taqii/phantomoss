import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('token')?.value;
  const { pathname } = request.nextUrl;

  let isValid = false;

  if (token) {
    try {
      // Use internal server URL in Docker if applicable, otherwise fallback to NEXT_PUBLIC_BASE_URL
      const baseUrl = process.env.INTERNAL_API_URL || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8080';
      
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      isValid = res.ok;
    } catch (error) {
      console.error('Token verification failed:', error);
      isValid = false;
    }
  }

  // Check if the user is requesting a dashboard route
  if (pathname.startsWith('/dashboard')) {
    if (!isValid) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      if (token) response.cookies.delete('token');
      return response;
    }
  }

  // Check if a logged-in user is trying to access auth pages
  if (pathname === '/login' || pathname === '/register') {
    if (isValid) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
  }

  return NextResponse.next();
}

// Configure which paths the proxy runs on
export const config = {
  matcher: ['/dashboard/:path*', '/login', '/register'],
};
