import { NextRequest, NextResponse } from 'next/server';

/**
 * CORS Configuration
 */
const corsConfig = {
  allowedOrigins: [
    process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    'http://localhost:3000',
    'http://localhost:3001',
  ],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'X-CSRF-Token',
  ],
  maxAge: 86400, // 24 hours
  credentials: true,
};

/**
 * Security headers configuration
 */
const securityHeaders: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-DNS-Prefetch-Control': 'on',
  'Permissions-Policy': 'camera=(), microphone=(self), geolocation=(self)',
};

/**
 * Check if origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  return corsConfig.allowedOrigins.includes(origin);
}

/**
 * Get CORS headers for a request
 */
export function getCorsHeaders(request: NextRequest): Record<string, string> {
  const origin = request.headers.get('origin');
  const headers: Record<string, string> = {};

  if (origin && isOriginAllowed(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }

  headers['Access-Control-Allow-Credentials'] = String(corsConfig.credentials);
  headers['Access-Control-Allow-Methods'] = corsConfig.allowedMethods.join(', ');
  headers['Access-Control-Allow-Headers'] = corsConfig.allowedHeaders.join(', ');
  headers['Access-Control-Max-Age'] = String(corsConfig.maxAge);

  return headers;
}

/**
 * Create response with security headers
 */
export function withSecurityHeaders<T>(
  data: T,
  options: {
    status?: number;
    request?: NextRequest;
    additionalHeaders?: Record<string, string>;
  } = {}
): NextResponse<T> {
  const { status = 200, request, additionalHeaders = {} } = options;

  const headers: Record<string, string> = {
    ...securityHeaders,
    ...additionalHeaders,
  };

  // Add CORS headers if request provided
  if (request) {
    Object.assign(headers, getCorsHeaders(request));
  }

  return NextResponse.json(data, { status, headers });
}

/**
 * Handle OPTIONS preflight request
 */
export function handlePreflight(request: NextRequest): NextResponse {
  const headers = {
    ...securityHeaders,
    ...getCorsHeaders(request),
  };

  return new NextResponse(null, {
    status: 204,
    headers,
  });
}

/**
 * Wrapper for API route handlers that adds security headers and CORS
 */
export function withCors<T extends (...args: any[]) => Promise<NextResponse>>(
  handler: T
): T {
  return (async (request: NextRequest, ...args: any[]) => {
    // Handle preflight
    if (request.method === 'OPTIONS') {
      return handlePreflight(request);
    }

    try {
      const response = await handler(request, ...args);

      // Clone response and add headers
      const headers = new Headers(response.headers);

      // Add security headers
      Object.entries(securityHeaders).forEach(([key, value]) => {
        if (!headers.has(key)) {
          headers.set(key, value);
        }
      });

      // Add CORS headers
      Object.entries(getCorsHeaders(request)).forEach(([key, value]) => {
        if (!headers.has(key)) {
          headers.set(key, value);
        }
      });

      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers,
      });
    } catch (error) {
      console.error('API Error:', error);
      return withSecurityHeaders(
        { error: 'Internal server error' },
        { status: 500, request }
      );
    }
  }) as T;
}

/**
 * Create error response with proper headers
 */
export function errorResponse(
  message: string,
  status: number,
  request?: NextRequest,
  code?: string
): NextResponse {
  const body: { error: string; code?: string } = { error: message };
  if (code) body.code = code;

  return withSecurityHeaders(body, { status, request });
}

/**
 * Create success response with proper headers
 */
export function successResponse<T>(
  data: T,
  request?: NextRequest,
  status = 200
): NextResponse<T> {
  return withSecurityHeaders(data, { status, request });
}

/**
 * Rate limiting helper (in-memory, for production use Redis)
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; resetIn: number } {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1, resetIn: windowMs };
  }

  if (record.count >= limit) {
    return {
      allowed: false,
      remaining: 0,
      resetIn: record.resetTime - now,
    };
  }

  record.count++;
  return {
    allowed: true,
    remaining: limit - record.count,
    resetIn: record.resetTime - now,
  };
}

/**
 * Get client IP from request
 */
export function getClientIp(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }

  const realIp = request.headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return 'unknown';
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate content type for JSON APIs
 */
export function validateContentType(request: NextRequest): boolean {
  const contentType = request.headers.get('content-type');
  return contentType?.includes('application/json') ?? false;
}
