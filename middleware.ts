import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth';

const protectedRoutes = ['/app', '/api/workspaces', '/api/projects', '/api/tasks'];
const publicRoutes = ['/login', '/register', '/api/auth'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  const isProtected = protectedRoutes.some((route) => pathname.startsWith(route));
  const isPublic = publicRoutes.some((route) => pathname.startsWith(route));

  const cookieStore = request.cookies;
  const sessionValue = cookieStore.get('session')?.value;
  
  let payload = null;
  if (sessionValue) {
    payload = await decrypt(sessionValue);
  }

  // Redirect to login if accessing a protected route without a valid session
  if (isProtected && (!payload || !payload.userId)) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Redirect to app if accessing login/register while authenticated
  if (isPublic && payload?.userId && !pathname.startsWith('/api')) {
    return NextResponse.redirect(new URL('/app/dashboard', request.url));
  }
  
  // Custom header to pass userId to server components/actions downstream
  const requestHeaders = new Headers(request.headers);
  if (payload?.userId) {
    requestHeaders.set('x-user-id', payload.userId as string);
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
