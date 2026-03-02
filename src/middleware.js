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

    if (!payload || !payload.userId || !payload.tenantId) {
      if (isApiRoute) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      } else {
        // Unset invalid cookie and redirect to login
        const res = NextResponse.redirect(new URL('/login', req.url));
        res.cookies.delete('himalaya_session');
        return res;
      }
    }

    const { role } = payload;

    // RBAC logic for API and UI routes
    // ---------------------------------
    
    // 1. ADMIN / SUPER_ADMIN Only Routes (Users)
    const isUserMgtRoute = pathname.startsWith('/api/users') || pathname.startsWith('/dashboard/users');
    if (isUserMgtRoute && (role !== 'ADMIN' && role !== 'SUPER_ADMIN')) {
      return isApiRoute 
        ? NextResponse.json({ error: 'Forbidden: Admins Only' }, { status: 403 })
        : NextResponse.redirect(new URL('/dashboard/sales', req.url)); // Safe fallback route
    }

    // 1b. SUPER_ADMIN Strict Routing
    const isSuperAdminRoute = pathname.startsWith('/api/super-admin') || pathname.startsWith('/dashboard/super-admin');
    
    if (isSuperAdminRoute && role !== 'SUPER_ADMIN') {
      return isApiRoute 
        ? NextResponse.json({ error: 'Forbidden: Platform Admins Only' }, { status: 403 })
        : NextResponse.redirect(new URL('/dashboard', req.url));
    }

    if (role === 'SUPER_ADMIN' && !isSuperAdminRoute && !isUserMgtRoute && (isDashboardRoute || isApiRoute)) {
      // Super Admins should not access shop operations like sales, inventory, etc.
      return isApiRoute
        ? NextResponse.json({ error: 'Super Admins do not have operational access' }, { status: 403 })
        : NextResponse.redirect(new URL('/dashboard/super-admin', req.url));
    }

    // 2. STAFF Restrictions (No Reports, No Dashboard Financials)
    const isDashboardRoot = pathname === '/dashboard';
    const isReportsRoute = pathname.startsWith('/api/reports') || pathname.startsWith('/dashboard/reports');
    const isSuppliersUiRoute = pathname.startsWith('/dashboard/suppliers');
    const isSuppliersApiRoute = pathname.startsWith('/api/suppliers');
    const isPurchasesRoute = pathname.startsWith('/api/purchases') || pathname.startsWith('/dashboard/purchases');
    
    if ((role === 'STAFF' || role === 'ACCOUNTANT') && (isSuppliersUiRoute || (isSuppliersApiRoute && req.method !== 'GET'))) {
      return isApiRoute 
        ? NextResponse.json({ error: 'Forbidden: Admins & Managers Only' }, { status: 403 })
        : NextResponse.redirect(new URL('/dashboard/sales', req.url));
    }

    if (role === 'STAFF' && isPurchasesRoute) {
      return isApiRoute 
        ? NextResponse.json({ error: 'Forbidden: Staff cannot access purchases' }, { status: 403 })
        : NextResponse.redirect(new URL('/dashboard/sales', req.url));
    }

    if (role === 'STAFF' && (isDashboardRoot || isReportsRoute || pathname.startsWith('/api/dashboard'))) {
       return isApiRoute 
        ? NextResponse.json({ error: 'Forbidden: Staff cannot access financial data' }, { status: 403 })
        : NextResponse.redirect(new URL('/dashboard/sales', req.url));
    }
  } // <-- Closes if (isApiRoute || isDashboardRoute)

  // Handle root path: redirect logged-in users to dashboard, let public users see landing page
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
    // Allow public users to see the landing page
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
