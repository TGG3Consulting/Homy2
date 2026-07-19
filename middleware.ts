import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Security middleware for Homy application
 * - Sets security headers on all responses
 * - Protects authenticated routes
 * - Handles CORS for API routes
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();
  const pathname = request.nextUrl.pathname;

  // ============================================
  // SECURITY HEADERS (OWASP Best Practices)
  // ============================================

  // Prevent clickjacking attacks
  response.headers.set('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  response.headers.set('X-Content-Type-Options', 'nosniff');

  // Enable XSS filter in legacy browsers
  response.headers.set('X-XSS-Protection', '1; mode=block');

  // Control referrer information
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

  // DNS prefetch control
  response.headers.set('X-DNS-Prefetch-Control', 'on');

  // Permissions policy (formerly Feature-Policy)
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(self), geolocation=(self), interest-cohort=()'
  );

  // Content Security Policy (CSP)
  // 'unsafe-eval' is only needed by Next.js in development (HMR/react-refresh);
  // drop it in production to shrink the XSS surface (VULN-021).
  const scriptSrc = process.env.NODE_ENV === 'production'
    ? "script-src 'self' 'unsafe-inline'"
    : "script-src 'self' 'unsafe-inline' 'unsafe-eval'";
  const isProd = process.env.NODE_ENV === 'production';
  const cspDirectives = [
    "default-src 'self'",
    scriptSrc,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob: https:",
    "font-src 'self' data: https://fonts.gstatic.com",
    "connect-src 'self' https: wss: https://api.openai.com https://*.anthropic.com",
    // Defense-in-depth: the app uses no plugins, iframes or web workers, so lock
    // these to the safest values (free hardening, no functional impact).
    "object-src 'none'",
    "frame-src 'none'",
    "worker-src 'self'",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    // Force any stray http subresource to https in production.
    ...(isProd ? ['upgrade-insecure-requests'] : []),
  ].join('; ');

  response.headers.set('Content-Security-Policy', cspDirectives);

  // ============================================
  // CORS HEADERS FOR API ROUTES
  // ============================================
  if (pathname.startsWith('/api')) {
    const origin = request.headers.get('origin');
    // Localhost origins only outside production (VULN-032).
    const allowedOrigins = [
      process.env.NEXT_PUBLIC_APP_URL,
      ...(process.env.NODE_ENV !== 'production' ? ['http://localhost:3000', 'http://localhost:3001'] : []),
    ].filter(Boolean) as string[];

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }

    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set(
      'Access-Control-Allow-Methods',
      'GET, POST, PUT, DELETE, PATCH, OPTIONS'
    );
    response.headers.set(
      'Access-Control-Allow-Headers',
      'Content-Type, Authorization, X-Requested-With, Accept, X-CSRF-Token'
    );
    response.headers.set('Access-Control-Max-Age', '86400');

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, { status: 204, headers: response.headers });
    }
  }

  // ============================================
  // PROTECTED ROUTES AUTHENTICATION
  // ============================================
  // Read token from HttpOnly cookie (secure against XSS)
  const token = request.cookies.get('homy_access_token')?.value;

  const protectedRoutes = [
    '/dashboard',
    '/list-property',
    '/favorites',
    '/my-properties',
    '/settings',
    '/profile',
  ];

  const isProtectedRoute = protectedRoutes.some(route =>
    pathname.startsWith(route)
  );

  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);

    // Preserve security headers on redirect
    const redirectResponse = NextResponse.redirect(loginUrl);
    response.headers.forEach((value, key) => {
      redirectResponse.headers.set(key, value);
    });

    return redirectResponse;
  }

  // NOTE (VULN-015): API-route authorization is enforced authoritatively inside
  // each route via the withAuth/withBroker/withAdmin/withModerator wrappers,
  // which verify the JWT signature AND token_version AND is_blocked. A partial
  // edge allow-list that merely checked token *presence* used to live here; it
  // covered only a few prefixes and gave a false impression of coverage, so it
  // was removed. Do not reintroduce edge auth unless it fully verifies tokens.

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder assets
     */
    '/((?!_next/static|_next/image|favicon.ico|public|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
