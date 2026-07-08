/**
 * Socket.io client singleton for real-time chat
 */

import { io, Socket } from 'socket.io-client';

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatar: string | null;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface TypingEvent {
  userId: string;
  conversationId: string;
}

export interface ReadReceiptEvent {
  userId: string;
  conversationId: string;
}

export interface ConversationClosedEvent {
  conversationId: string;
  message: string;
}

type MessageCallback = (message: ChatMessage) => void;
type TypingCallback = (event: TypingEvent) => void;
type ReadReceiptCallback = (event: ReadReceiptEvent) => void;
type ConversationClosedCallback = (event: ConversationClosedEvent) => void;
type ConnectionCallback = (connected: boolean) => void;
type ErrorCallback = (error: string) => void;

class SocketClient {
  private socket: Socket | null = null;
  private messageCallbacks: Set<MessageCallback> = new Set();
  private typingCallbacks: Set<TypingCallback> = new Set();
  private readReceiptCallbacks: Set<ReadReceiptCallback> = new Set();
  private conversationClosedCallbacks: Set<ConversationClosedCallback> = new Set();
  private connectionCallbacks: Set<ConnectionCallback> = new Set();
  private errorCallbacks: Set<ErrorCallback> = new Set();
  private authRetryAttempts = 0;
  private maxAuthRetryAttempts = 5;
  private authRetryTimeout: ReturnType<typeof setTimeout> | null = null;
  private pendingJoins: Set<string> = new Set(); // Queue for rooms to join when connected

  connect(token?: string): void {
    if (this.socket?.connected) {
      console.log('[SocketClient] Already connected');
      return;
    }

    // Disconnect existing socket if any
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    console.log('[SocketClient] Connecting...');

    this.socket = io('/', {
      path: '/socket.io',
      auth: token ? { token } : undefined,
      withCredentials: true,
      reconnection: false, // We handle reconnection manually for auth errors
      timeout: 10000,
    });

    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('[SocketClient] Connected');
      this.authRetryAttempts = 0; // Reset on successful connect
      if (this.authRetryTimeout) {
        clearTimeout(this.authRetryTimeout);
        this.authRetryTimeout = null;
      }
      this.notifyConnectionChange(true);

      // Process pending joins queue
      if (this.pendingJoins.size > 0) {
        console.log(`[SocketClient] Processing ${this.pendingJoins.size} pending joins`);
        this.pendingJoins.forEach(conversationId => {
          this.socket?.emit('join', conversationId);
        });
        this.pendingJoins.clear();
      }
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[SocketClient] Disconnected:', reason);
      this.notifyConnectionChange(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('[SocketClient] Connection error:', error.message);

      // Check if it's an auth error
      const isAuthError = error.message.includes('Unauthorized') ||
                          error.message.includes('unauthorized') ||
                          error.message.includes('No token');

      if (isAuthError && this.authRetryAttempts < this.maxAuthRetryAttempts) {
        this.authRetryAttempts++;
        console.log(`[SocketClient] Auth failed, retry ${this.authRetryAttempts}/${this.maxAuthRetryAttempts} in 2s...`);

        // Retry after 2 seconds (user might log in)
        this.authRetryTimeout = setTimeout(() => {
          this.connect();
        }, 2000);
      } else if (this.authRetryAttempts >= this.maxAuthRetryAttempts) {
        console.log('[SocketClient] Max auth retries reached, stopping');
        // Don't show error to user - they're probably not logged in
      }
    });

    this.socket.on('error', (data: { message: string }) => {
      console.error('[SocketClient] Server error:', data.message);
      this.notifyError(data.message);
    });

    this.socket.on('new_message', (message: ChatMessage) => {
      console.log('[SocketClient] New message:', message.id);
      this.messageCallbacks.forEach(cb => cb(message));
    });

    this.socket.on('typing', (event: TypingEvent) => {
      this.typingCallbacks.forEach(cb => cb(event));
    });

    this.socket.on('read_receipt', (event: ReadReceiptEvent) => {
      this.readReceiptCallbacks.forEach(cb => cb(event));
    });

    this.socket.on('joined', (data: { conversationId: string }) => {
      console.log('[SocketClient] Joined room:', data.conversationId);
    });

    this.socket.on('conversation_closed', (event: ConversationClosedEvent) => {
      console.log('[SocketClient] Conversation closed:', event.conversationId);
      this.conversationClosedCallbacks.forEach(cb => cb(event));
    });
  }

  private notifyConnectionChange(connected: boolean): void {
    this.connectionCallbacks.forEach(cb => cb(connected));
  }

  private notifyError(error: string): void {
    this.errorCallbacks.forEach(cb => cb(error));
  }

  disconnect(): void {
    if (this.authRetryTimeout) {
      clearTimeout(this.authRetryTimeout);
      this.authRetryTimeout = null;
    }
    if (this.socket) {
      console.log('[SocketClient] Disconnecting');
      this.socket.disconnect();
      this.socket = null;
    }
    this.authRetryAttempts = 0;
  }

  join(conversationId: string): void {
    if (!this.socket?.connected) {
      console.warn('[SocketClient] Cannot join - not connected');
      return;
    }
    this.socket.emit('join', conversationId);
  }

  /**
   * Join a conversation room when socket is ready.
   * If already connected, joins immediately.
   * If not connected, queues the join for when connection is established.
   */
  joinWhenReady(conversationId: string): void {
    if (this.socket?.connected) {
      console.log(`[SocketClient] Joining room immediately: ${conversationId}`);
      this.socket.emit('join', conversationId);
    } else {
      console.log(`[SocketClient] Queuing join for: ${conversationId}`);
      this.pendingJoins.add(conversationId);
    }
  }

  leave(conversationId: string): void {
    // Also remove from pending if not yet joined
    this.pendingJoins.delete(conversationId);
    if (!this.socket?.connected) return;
    this.socket.emit('leave', conversationId);
  }

  sendMessage(conversationId: string, content: string): void {
    if (!this.socket?.connected) {
      console.warn('[SocketClient] Cannot send - not connected');
      return;
    }
    this.socket.emit('message', { conversationId, content });
  }

  sendTyping(conversationId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('typing', conversationId);
  }

  sendRead(conversationId: string): void {
    if (!this.socket?.connected) return;
    this.socket.emit('read', conversationId);
  }

  closeConversation(conversationId: string): void {
    if (!this.socket?.connected) {
      console.warn('[SocketClient] Cannot close conversation - not connected');
      return;
    }
    this.socket.emit('close_conversation', conversationId);
  }

  /**
   * Client leaves conversation (client-initiated close)
   */
  clientLeave(conversationId: string): void {
    if (!this.socket?.connected) {
      console.warn('[SocketClient] Cannot client leave - not connected');
      return;
    }
    this.socket.emit('client_leave', conversationId);
  }

  // Event subscriptions
  onMessage(callback: MessageCallback): () => void {
    this.messageCallbacks.add(callback);
    return () => this.messageCallbacks.delete(callback);
  }

  onTyping(callback: TypingCallback): () => void {
    this.typingCallbacks.add(callback);
    return () => this.typingCallbacks.delete(callback);
  }

  onReadReceipt(callback: ReadReceiptCallback): () => void {
    this.readReceiptCallbacks.add(callback);
    return () => this.readReceiptCallbacks.delete(callback);
  }

  onConversationClosed(callback: ConversationClosedCallback): () => void {
    this.conversationClosedCallbacks.add(callback);
    return () => this.conversationClosedCallbacks.delete(callback);
  }

  onConnectionChange(callback: ConnectionCallback): () => void {
    this.connectionCallbacks.add(callback);
    return () => this.connectionCallbacks.delete(callback);
  }

  onError(callback: ErrorCallback): () => void {
    this.errorCallbacks.add(callback);
    return () => this.errorCallbacks.delete(callback);
  }

  get connected(): boolean {
    return this.socket?.connected ?? false;
  }
}

// Singleton export
export const socketClient = new SocketClient();
export default socketClient;
