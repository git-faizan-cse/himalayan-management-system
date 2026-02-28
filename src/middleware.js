import { NextResponse } from 'next/server';
import { verifySession } from '@/lib/auth';

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Protect /dashboard and /api (except auth routes)
  const isApiRoute = pathname.startsWith('/api') && !pathname.startsWith('/api/auth');
  const isDashboardRoute = pathname.startsWith('/dashboard');

  if (isApiRoute || isDashboardRoute) {
    const sessionCookie = req.cookies.get('himalaya_session')?.value;

    if (!sessionCookie) {
      if (isApiRoute) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      } else {
        return NextResponse.redirect(new URL('/login', req.url));
      }
    }

    const payload = await verifySession(sessionCookie);

    if (!payload || !payload.userId) {
      if (isApiRoute) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      } else {
        // Unset invalid cookie and redirect to login
        const res = NextResponse.redirect(new URL('/login', req.url));
        res.cookies.delete('himalaya_session');
        return res;
      }
    }

    // Role-based auth example logic for future routes:
    // if (pathname.startsWith('/dashboard/admin') && payload.role !== 'ADMIN') { ... }
  }

  // Redirect root to dashboard or login
  if (pathname === '/') {
    const sessionCookie = req.cookies.get('himalaya_session')?.value;
    if (sessionCookie) {
         try {
             const payload = await verifySession(sessionCookie);
             if (payload && payload.userId) {
                 return NextResponse.redirect(new URL('/dashboard', req.url));
             }
         } catch(e) {}
    }
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
