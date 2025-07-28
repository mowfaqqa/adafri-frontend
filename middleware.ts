// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/register', 
  '/auth/forgot-password',
  '/invite', // For organization invitations
  '/', // Landing page
  '/about',
  '/contact',
  '/privacy',
  '/terms'
];

// Routes that require authentication but not organization membership
const AUTH_ONLY_ROUTES = [
  '/profile',
  '/settings/account',
  '/auth/setup',
  '/invite/accept',
  '/invite/reject'
];

// Routes that require both authentication and organization membership
const ORG_REQUIRED_ROUTES = [
  '/dashboard'
];

// Check if route requires authentication
function requiresAuth(pathname: string): boolean {
  return !PUBLIC_ROUTES.some(route => 
    pathname === route || pathname.startsWith(route + '/')
  );
}

// Check if route requires organization membership
function requiresOrganization(pathname: string): boolean {
  return ORG_REQUIRED_ROUTES.some(route => 
    pathname.startsWith(route)
  ) || (
    requiresAuth(pathname) && 
    !AUTH_ONLY_ROUTES.some(route => 
      pathname === route || pathname.startsWith(route + '/')
    )
  );
}

// Get token from cookies
function getTokenFromCookies(request: NextRequest): string | null {
  // Check for Djombi token first (preferred)
  const djombiToken = request.cookies.get('djombi_access_token')?.value;
  if (djombiToken) return djombiToken;
  
  // Fallback to Adafri token
  const adafriToken = request.cookies.get('__frsadfrusrtkn')?.value;
  if (adafriToken) return adafriToken;
  
  // Legacy token support
  const legacyToken = request.cookies.get('accessToken')?.value;
  if (legacyToken) return legacyToken;
  
  return null;
}

// Check if user is authenticated
function isAuthenticated(request: NextRequest): boolean {
  const token = getTokenFromCookies(request);
  const authStatus = request.cookies.get('auth_status')?.value;
  
  return !!(token && authStatus === 'authenticated');
}

// Check if user has organization membership
function hasOrganization(request: NextRequest): boolean {
  const currentOrgId = request.cookies.get('current_organization_id')?.value;
  return !!currentOrgId;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/static/') ||
    pathname.includes('.') ||
    pathname.startsWith('/icons/') ||
    pathname.startsWith('/assets/')
  ) {
    return NextResponse.next();
  }

  const authenticated = isAuthenticated(request);
  const hasOrg = hasOrganization(request);
  const needsAuth = requiresAuth(pathname);
  const needsOrg = requiresOrganization(pathname);

  // Console logging for debugging (remove in production)
  console.log(`[Middleware] Path: ${pathname}`, {
    authenticated,
    hasOrg,
    needsAuth,
    needsOrg
  });

  // Redirect unauthenticated users trying to access protected routes
  if (needsAuth && !authenticated) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Redirect authenticated users away from auth pages
  if (authenticated && pathname.startsWith('/auth/') && pathname !== '/auth/setup') {
    // If user has organization, go to dashboard
    if (hasOrg) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // If no organization, let them through to potentially create one
    return NextResponse.next();
  }

  // Handle organization requirements
  if (authenticated && needsOrg && !hasOrg && pathname !== '/auth/setup') {
    // Redirect to organization setup/creation page
    return NextResponse.redirect(new URL('/auth/setup', request.url));
  }

  // Redirect users with organizations away from setup page
  if (authenticated && hasOrg && pathname === '/auth/setup') {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Allow the request to proceed
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
     * - public folder files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};