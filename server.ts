/**
 * HomLy Server with WebSocket and Socket.io support
 * - /ws/chat: AI Chat via Claude API
 * - /socket.io: Real-time live chat
 */

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import next from 'next';
import { WebSocketServer, WebSocket } from 'ws';
import { Server as SocketIOServer } from 'socket.io';
import { anthropicSessionManager } from './lib/anthropicClient';
import { jwtService } from './lib/services/jwtService';
import { prisma } from './lib/db/prisma';
import { v4 as uuidv4 } from 'uuid';

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const PORT = parseInt(process.env.PORT || '3000', 10);

// Helper to parse cookie string
function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const cookies: Record<string, string> = {};
  if (!cookieHeader) return cookies;
  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.split('=');
    if (name && rest.length > 0) {
      cookies[name.trim()] = rest.join('=').trim();
    }
  });
  return cookies;
}

app.prepare().then(() => {
  // Create HTTP server
  const server = createServer((req: IncomingMessage, res: ServerResponse) => {
    const parsedUrl = parse(req.url || '', true);
    handle(req, res, parsedUrl);
  });

  // ============================================
  // Socket.io for Live Chat
  // ============================================

  const io = new SocketIOServer(server, {
    path: '/socket.io',
    cors: {
      origin: dev ? '*' : process.env.NEXT_PUBLIC_APP_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Socket.io Auth middleware
  io.use(async (socket, next) => {
    try {
      // Try to get token from auth object first, then from cookies
      let token = socket.handshake.auth?.token;

      if (!token) {
        const cookies = parseCookies(socket.handshake.headers.cookie);
        token = cookies['homy_access_token'];
      }

      if (!token) {
        return next(new Error('Unauthorized: No token provided'));
      }

      const payload = jwtService.verifyAccessToken(token);
      if (!payload) {
        return next(new Error('Unauthorized: Invalid token'));
      }

      // Attach user data to socket
      socket.data.userId = payload.userId;
      socket.data.email = payload.email;
      next();
    } catch (err) {
      console.error('[SocketIO] Auth error:', err);
      next(new Error('Unauthorized'));
    }
  });

  // Socket.io connection handler
  io.on('connection', (socket) => {
    const userId = socket.data.userId;
    console.log(`[SocketIO] User connected: ${userId}`);

    // Join a conversation room
    socket.on('join', async (conversationId: string) => {
      try {
        // Verify user is participant in this conversation
        const conversation = await prisma.conversation.findFirst({
          where: {
            id: conversationId,
            OR: [
              { client_id: userId },
              { consultant_id: userId }
            ]
          }
        });

        if (!conversation) {
          socket.emit('error', { message: 'Not authorized to join this conversation' });
          return;
        }

        socket.join(conversationId);
        console.log(`[SocketIO] User ${userId} joined room ${conversationId}`);

        // Send confirmation
        socket.emit('joined', { conversationId });
      } catch (err) {
        console.error('[SocketIO] Join error:', err);
        socket.emit('error', { message: 'Failed to join conversation' });
      }
    });

    // Leave a conversation room
    socket.on('leave', (conversationId: string) => {
      socket.leave(conversationId);
      console.log(`[SocketIO] User ${userId} left room ${conversationId}`);
    });

    // Send a message
    socket.on('message', async (data: { conversationId: string; content: string }) => {
      const { conversationId, content } = data;

      if (!content?.trim()) {
        socket.emit('error', { message: 'Message content is required' });
        return;
      }

      try {
        // Verify user is participant
        const conversation = await prisma.conversation.findFirst({
          where: {
            id: conversationId,
            OR: [
              { client_id: userId },
              { consultant_id: userId }
            ]
          }
        });

        if (!conversation) {
          socket.emit('error', { message: 'Not authorized' });
          return;
        }

        // Get sender info
        const sender = await prisma.user.findUnique({
          where: { id: userId },
          select: { id: true, first_name: true, last_name: true, avatar_url: true }
        });

        // Create message in DB
        const newMessage = await prisma.liveChatMessage.create({
          data: {
            id: uuidv4(),
            conversation_id: conversationId,
            sender_id: userId,
            content: content.trim(),
            read: false
          }
        });

        // Update conversation timestamp
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updated_at: new Date() }
        });

        // Broadcast to all in room (including sender for confirmation)
        const messagePayload = {
          id: newMessage.id,
          conversationId,
          senderId: userId,
          senderName: sender ? `${sender.first_name} ${sender.last_name}`.trim() : '',
          senderAvatar: sender?.avatar_url || null,
          content: newMessage.content,
          read: newMessage.read,
          createdAt: newMessage.created_at.toISOString()
        };

        io.to(conversationId).emit('new_message', messagePayload);
        console.log(`[SocketIO] Message sent in ${conversationId} by ${userId}`);
      } catch (err) {
        console.error('[SocketIO] Message error:', err);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    // Typing indicator
    socket.on('typing', (conversationId: string) => {
      socket.to(conversationId).emit('typing', { userId, conversationId });
    });

    // Mark messages as read
    socket.on('read', async (conversationId: string) => {
      try {
        // Mark all messages from other users as read
        await prisma.liveChatMessage.updateMany({
          where: {
            conversation_id: conversationId,
            sender_id: { not: userId },
            read: false
          },
          data: { read: true }
        });

        // Notify others in room
        socket.to(conversationId).emit('read_receipt', { userId, conversationId });
      } catch (err) {
        console.error('[SocketIO] Read receipt error:', err);
      }
    });

    // Client leaves conversation (client-initiated close)
    socket.on('client_leave', async (conversationId: string) => {
      try {
        // Verify this is the client for this conversation
        const conv = await prisma.conversation.findUnique({
          where: { id: conversationId }
        });

        if (!conv) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        if (conv.client_id !== userId) {
          socket.emit('error', { message: 'Only client can leave conversation' });
          return;
        }

        // Update status in DB
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { status: 'resolved' }
        });

        // Create system message
        await prisma.liveChatMessage.create({
          data: {
            id: uuidv4(),
            conversation_id: conversationId,
            sender_id: userId,
            content: '[SYSTEM] Клиент завершил диалог.',
            read: true
          }
        });

        // Notify all in room
        io.to(conversationId).emit('conversation_closed', {
          conversationId,
          message: 'Диалог завершён клиентом.'
        });

        console.log(`[SocketIO] Conversation ${conversationId} closed by client ${userId}`);
      } catch (err) {
        console.error('[SocketIO] Client leave error:', err);
        socket.emit('error', { message: 'Failed to leave conversation' });
      }
    });

    // Close conversation (consultant only)
    socket.on('close_conversation', async (conversationId: string) => {
      try {
        // Verify this is the consultant for this conversation
        const conv = await prisma.conversation.findUnique({
          where: { id: conversationId }
        });

        if (!conv) {
          socket.emit('error', { message: 'Conversation not found' });
          return;
        }

        if (conv.consultant_id !== userId) {
          socket.emit('error', { message: 'Only consultant can close conversation' });
          return;
        }

        // Update status in DB
        await prisma.conversation.update({
          where: { id: conversationId },
          data: { status: 'resolved' }
        });

        // Create system message
        await prisma.liveChatMessage.create({
          data: {
            id: uuidv4(),
            conversation_id: conversationId,
            sender_id: userId,
            content: '[SYSTEM] Диалог завершён консультантом.',
            read: true
          }
        });

        // Notify all in room
        io.to(conversationId).emit('conversation_closed', {
          conversationId,
          message: 'Диалог завершён. Для нового обращения нажмите "Написать консультанту".'
        });

        console.log(`[SocketIO] Conversation ${conversationId} closed by ${userId}`);
      } catch (err) {
        console.error('[SocketIO] Close conversation error:', err);
        socket.emit('error', { message: 'Failed to close conversation' });
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`[SocketIO] User disconnected: ${userId}`);
    });
  });

  // ============================================
  // WebSocket for AI Chat (/ws/chat)
  // ============================================

  const wssAI = new WebSocketServer({ noServer: true });

  // Handle WebSocket upgrade manually (only for /ws/chat)
  server.on('upgrade', (request, socket, head) => {
    const { pathname } = parse(request.url || '', true);

    if (pathname === '/ws/chat') {
      wssAI.handleUpgrade(request, socket, head, (ws) => {
        wssAI.emit('connection', ws, request);
      });
    } else if (!pathname?.startsWith('/socket.io')) {
      // Socket.io handles its own upgrades, only destroy non-matching paths
      socket.destroy();
    }
  });

  wssAI.on('connection', (ws: WebSocket) => {
    const sessionId = uuidv4();
    console.log(`[WebSocket] New AI connection, sessionId: ${sessionId}`);

    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'ready' }));
    }

    ws.on('message', async (data: Buffer | ArrayBuffer | Buffer[]) => {
      try {
        const message = JSON.parse(data.toString());

        if (message.type === 'message' && message.content) {
          try {
            const response = await anthropicSessionManager.sendMessage(
              sessionId,
              message.content
            );

            if (response.showPropertiesData && response.showPropertiesData.properties.length > 0) {
              if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({
                  type: 'properties_update',
                  data: {
                    properties: response.showPropertiesData.properties,
                    top_choice: response.showPropertiesData.top_choice_id,
                    criteria: response.showPropertiesData.criteria,
                    top_choice_title: response.showPropertiesData.top_choice_title,
                    top_choice_reason: response.showPropertiesData.top_choice_reason,
                  },
                }));
              }
            }

            if (response.text && ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'message', content: response.text }));
            }

            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({ type: 'done' }));
            }
          } catch (apiError) {
            console.error(`[WebSocket] API error for session ${sessionId}:`, apiError);
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(JSON.stringify({
                type: 'error',
                error: apiError instanceof Error ? apiError.message : 'Failed to get response'
              }));
            }
          }
        }
      } catch (err) {
        console.error(`[WebSocket] Failed to handle message:`, err);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'error', error: 'Failed to process message' }));
        }
      }
    });

    ws.on('close', () => {
      console.log(`[WebSocket] Connection closed, sessionId: ${sessionId}`);
      anthropicSessionManager.destroySession(sessionId);
    });

    ws.on('error', (err: Error) => {
      console.error(`[WebSocket] Error for sessionId ${sessionId}:`, err);
      anthropicSessionManager.destroySession(sessionId);
    });
  });

  // ============================================
  // Graceful shutdown
  // ============================================

  const gracefulShutdown = (signal: string) => {
    console.log(`\n[Server] Received ${signal}, shutting down gracefully...`);

    anthropicSessionManager.shutdown();

    // Close Socket.io
    io.close(() => {
      console.log('[Server] Socket.io server closed');
    });

    wssAI.close(() => {
      console.log('[Server] AI WebSocket server closed');
    });

    server.close(() => {
      console.log('[Server] HTTP server closed');
      process.exit(0);
    });

    setTimeout(() => {
      console.error('[Server] Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Start listening
  server.listen(PORT, () => {
    console.log(`[Server] Ready on http://localhost:${PORT}`);
    console.log(`[Server] AI Chat WebSocket: ws://localhost:${PORT}/ws/chat`);
    console.log(`[Server] Live Chat Socket.io: http://localhost:${PORT}/socket.io`);
    console.log(`[Server] Mode: ${dev ? 'development' : 'production'}`);
  });
});
