import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { sessionManager } from '@/lib/sessionManager';
import { checkRateLimit, getClientIP, RATE_LIMITS, rateLimitResponse } from '@/lib/rateLimiter';
import { getAccessTokenFromRequest } from '@/lib/cookies';
import jwtService from '@/lib/services/jwtService';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const CHAT_OWNER_COOKIE = 'homy_chat_owner';

/**
 * Ownership binding for AI chat sessions (VULN-003).
 *
 * The client-supplied `sessionId` MUST NOT be trusted as the session key on
 * its own — anyone who guesses/replays another client's id would resume their
 * conversation. We namespace it with a server-controlled owner:
 *   - authenticated users → `u:<userId>` (from the verified JWT cookie)
 *   - anonymous users     → `a:<opaque>` where <opaque> is a 256-bit value we
 *     store in an HttpOnly cookie the client cannot read or forge.
 * The effective key `<owner>::<sessionId>` is what SessionManager sees, so one
 * client can never address another client's history.
 */
function resolveSessionOwner(req: NextRequest): { owner: string; setCookie?: string } {
  const token = getAccessTokenFromRequest(req);
  if (token) {
    const payload = jwtService.verifyAccessToken(token);
    if (payload?.userId) return { owner: `u:${payload.userId}` };
  }

  const cookieHeader = req.headers.get('cookie') || '';
  const existing = cookieHeader
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${CHAT_OWNER_COOKIE}=`));
  if (existing) {
    return { owner: `a:${existing.slice(CHAT_OWNER_COOKIE.length + 1)}` };
  }

  const opaque = crypto.randomBytes(32).toString('hex');
  const secure = process.env.NODE_ENV === 'production' || process.env.HTTPS_ENABLED === 'true';
  const setCookie =
    `${CHAT_OWNER_COOKIE}=${opaque}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}` +
    (secure ? '; Secure' : '');
  return { owner: `a:${opaque}`, setCookie };
}

function scopedKey(owner: string, sessionId: string): string {
  return `${owner}::${sessionId}`;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatRequest {
  messages: ChatMessage[];
  sessionId: string;
}

export async function POST(request: NextRequest) {
  try {
    // Denial-of-wallet protection: this endpoint drives an expensive AI session.
    // Rate-limit per client IP (VULN-004).
    const rl = checkRateLimit(`chat:${getClientIP(request)}`, RATE_LIMITS.ai);
    if (!rl.success) return rateLimitResponse(rl);

    const body: ChatRequest = await request.json();
    const { messages, sessionId } = body;

    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Session ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!messages || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'No messages provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const lastMessage = messages[messages.length - 1];

    if (!lastMessage.content || lastMessage.content.trim() === '') {
      return new Response(JSON.stringify({ error: 'Empty message content' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Cap input length (VULN-012): bound prompt-injection surface + token/cost abuse.
    if (lastMessage.content.length > 4000) {
      return new Response(JSON.stringify({ error: 'Message too long (max 4000 chars)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Bind the client sessionId to a server-controlled owner (VULN-003).
    const { owner, setCookie } = resolveSessionOwner(request);
    const effectiveKey = scopedKey(owner, sessionId);

    // Create SSE stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send message to persistent Claude session
          await sessionManager.sendMessage(
            effectiveKey,
            lastMessage.content,
            controller
          );
        } catch (error) {
          console.error('[API] Error sending message:', error);

          const encoder = new TextEncoder();
          // Do NOT leak upstream/SDK error detail to the client (VULN-010):
          // it can disclose model IDs, quota/billing state, internal URLs.
          const errorData = {
            type: 'error',
            error: 'Failed to send message'
          };

          try {
            if (controller.desiredSize !== null) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`));
            }
            controller.close();
          } catch (e) {
            // Controller already closed
          }
        }
      },

      cancel() {
        console.log('[API] Client disconnected - stream cancelled');
        // Session will be cleaned up by timeout or explicit cleanup request
      }
    });

    const headers: Record<string, string> = {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    };
    // Issue the anonymous owner cookie on first contact (VULN-003).
    if (setCookie) headers['Set-Cookie'] = setCookie;

    return new Response(stream, { headers });

  } catch (error) {
    console.error('[API] Route error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

// DELETE endpoint to cleanup session when client closes
export async function DELETE(request: NextRequest) {
  try {
    // Rate-limit session cleanup too (VULN-017).
    const rl = checkRateLimit(`chat-del:${getClientIP(request)}`, RATE_LIMITS.api);
    if (!rl.success) return rateLimitResponse(rl);

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Session ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Only the owner can clean up their own session (VULN-003): scope the key
    // exactly as POST does, so one client can't destroy another's session.
    const { owner } = resolveSessionOwner(request);
    sessionManager.cleanupSession(scopedKey(owner, sessionId));

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[API] Cleanup error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
