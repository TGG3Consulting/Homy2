import jwt from 'jsonwebtoken';

const ACCESS_TOKEN_EXPIRY = '15m';
const REFRESH_TOKEN_EXPIRY = '7d';

// SECURITY: Get secrets at runtime, fail fast if not configured
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'CRITICAL: JWT_SECRET must be configured in environment variables. ' +
      'Generate with: openssl rand -base64 64'
    );
  }
  return secret;
}

function getJwtRefreshSecret(): string {
  const secret = process.env.JWT_REFRESH_SECRET;
  if (!secret) {
    throw new Error(
      'CRITICAL: JWT_REFRESH_SECRET must be configured in environment variables. ' +
      'Generate with: openssl rand -base64 64'
    );
  }
  return secret;
}

export interface TokenPayload {
  userId: string;
  email: string;
  tokenVersion?: number;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenVersion?: number;
}

export const jwtService = {
  generateAccessToken(userId: string, email: string, tokenVersion = 0): string {
    return jwt.sign({ userId, email, tokenVersion }, getJwtSecret(), { expiresIn: ACCESS_TOKEN_EXPIRY });
  },

  generateRefreshToken(userId: string, tokenVersion = 0): string {
    return jwt.sign({ userId, tokenVersion }, getJwtRefreshSecret(), { expiresIn: REFRESH_TOKEN_EXPIRY });
  },

  verifyAccessToken(token: string): TokenPayload | null {
    try {
      return jwt.verify(token, getJwtSecret()) as TokenPayload;
    } catch {
      return null;
    }
  },

  verifyRefreshToken(token: string): RefreshTokenPayload | null {
    try {
      return jwt.verify(token, getJwtRefreshSecret()) as RefreshTokenPayload;
    } catch {
      return null;
    }
  },

  extractTokenFromHeader(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
};

export default jwtService;
