import { NextRequest } from 'next/server';
import { sessionManager } from '@/lib/sessionManager';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

    // Create SSE stream
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Send message to persistent Claude session
          await sessionManager.sendMessage(
            sessionId,
            lastMessage.content,
            controller
          );
        } catch (error) {
          console.error('[API] Error sending message:', error);

          const encoder = new TextEncoder();
          const errorData = {
            type: 'error',
            error: error instanceof Error ? error.message : 'Failed to send message'
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

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Accel-Buffering': 'no',
      },
    });

  } catch (error) {
    console.error('[API] Route error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
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
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return new Response(JSON.stringify({ error: 'Session ID is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    sessionManager.cleanupSession(sessionId);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[API] Cleanup error:', error);
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
