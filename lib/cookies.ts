import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const ACCESS_TOKEN_NAME = 'homy_access_token';
const REFRESH_TOKEN_NAME = 'homy_refresh_token';

// Cookie settings for production security
// Auth cookies: HttpOnly (no JS access) + SameSite=lax (blocks cross-site CSRF on
// state-changing requests — VULN-020) + Secure. Secure is always on in production
// (and whenever HTTPS is enabled) so tokens are never sent over plain HTTP (VULN-025).
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production' || process.env.HTTPS_ENABLED === 'true',
  sameSite: 'lax' as const,
  path: '/',
};

// Access token: 15 minutes
const ACCESS_TOKEN_MAX_AGE = 15 * 60;
// Refresh token: 7 days
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60;

/**
 * Set auth tokens in HttpOnly cookies on the response
 */
export function setAuthCookies(
  response: NextResponse,
  accessToken: string,
  refreshToken: string
): NextResponse {
  response.cookies.set(ACCESS_TOKEN_NAME, accessToken, {
    ...COOKIE_OPTIONS,
    maxAge: ACCESS_TOKEN_MAX_AGE,
  });

  response.cookies.set(REFRESH_TOKEN_NAME, refreshToken, {
    ...COOKIE_OPTIONS,
    maxAge: REFRESH_TOKEN_MAX_AGE,
  });

  return response;
}

/**
 * Clear auth cookies on the response (logout)
 */
export function clearAuthCookies(response: NextResponse): NextResponse {
  response.cookies.set(ACCESS_TOKEN_NAME, '', {
    ...COOKIE_OPTIONS,
    maxAge: 0,
  });

  response.cookies.set(REFRESH_TOKEN_NAME, '', {
    ...COOKIE_OPTIONS,
    maxAge: 0,
  });

  return response;
}

/**
 * Get access token from cookies (for API routes)
 */
export async function getAccessToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(ACCESS_TOKEN_NAME)?.value || null;
}

/**
 * Get refresh token from cookies (for API routes)
 */
export async function getRefreshToken(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(REFRESH_TOKEN_NAME)?.value || null;
}

/**
 * Get access token from request cookies (for middleware)
 */
export function getAccessTokenFromRequest(request: Request): string | null {
  const cookieHeader = request.headers.get('cookie');
  if (!cookieHeader) return null;

  const cookies = parseCookies(cookieHeader);
  return cookies[ACCESS_TOKEN_NAME] || null;
}

/**
 * Parse cookie header string into object
 */
function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {};
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.trim().split('=');
    if (name && rest.length > 0) {
      cookies[name] = rest.join('=');
    }
  });
  return cookies;
}

export const COOKIE_NAMES = {
  ACCESS: ACCESS_TOKEN_NAME,
  REFRESH: REFRESH_TOKEN_NAME,
};
