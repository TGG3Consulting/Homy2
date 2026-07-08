/**
 * WebSocket client service for browser-side chat communication
 */

export interface PropertyDisplayData {
  properties: string[];      // IDs of properties to show
  top_choice?: string;       // ID of the recommended property
  criteria_extracted: string[]; // What criteria AI extracted from user query
  insights: {
    total_found: number;     // Total properties matching criteria
    shown: number;           // Number being displayed
    best_district?: string;  // AI-identified best district for this search
    reason?: string;         // Reason for recommendations
  };
}

export interface ChatCallbacks {
  onReady?: () => void;
  onMessage?: (content: string) => void;
  onPropertiesUpdate?: (data: PropertyDisplayData) => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
  onConnectionChange?: (state: 'connecting' | 'connected' | 'disconnected') => void;
}

interface WebSocketMessage {
  type: 'ready' | 'message' | 'done' | 'error' | 'properties_update';
  content?: string;
  error?: string;
  data?: PropertyDisplayData;
}

interface OutgoingMessage {
  type: 'message';
  content: string;
}

export class ChatServiceWs {
  private ws: WebSocket | null = null;
  private isConnected: boolean = false;
  private callbacks: ChatCallbacks = {};
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private intentionalClose: boolean = false;

  /**
   * Connect to the WebSocket server
   * @returns Promise that resolves when connection is established
   */
  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.isConnected) {
        resolve();
        return;
      }

      this.intentionalClose = false;
      this.callbacks.onConnectionChange?.('connecting');

      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/chat`;

      try {
        this.ws = new WebSocket(wsUrl);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create WebSocket';
        this.callbacks.onConnectionChange?.('disconnected');
        reject(new Error(errorMessage));
        return;
      }

      this.ws.onopen = () => {
        this.isConnected = true;
        this.reconnectAttempts = 0;
        // Don't set 'connected' here - wait for 'ready' message from server
        // which indicates PTY session is initialized
        resolve();
      };

      this.ws.onmessage = (event: MessageEvent) => {
        this.handleMessage(event);
      };

      this.ws.onclose = (event: CloseEvent) => {
        this.handleClose(event);
      };

      this.ws.onerror = (event: Event) => {
        this.handleError(event, reject);
      };
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const data: WebSocketMessage = JSON.parse(event.data);

      switch (data.type) {
        case 'ready':
          this.callbacks.onConnectionChange?.('connected');
          this.callbacks.onReady?.();
          break;
        case 'message':
          if (data.content !== undefined) {
            this.callbacks.onMessage?.(data.content);
          }
          break;
        case 'done':
          this.callbacks.onComplete?.();
          break;
        case 'properties_update':
          if (data.data) {
            this.callbacks.onPropertiesUpdate?.(data.data);
          }
          break;
        case 'error':
          this.callbacks.onError?.(data.error || 'Unknown error');
          break;
        default:
          console.warn('Unknown WebSocket message type:', data.type);
      }
    } catch (parseError) {
      console.error('Failed to parse WebSocket message:', event.data, parseError);
    }
  }

  /**
   * Handle WebSocket close event
   */
  private handleClose(event: CloseEvent): void {
    const wasConnected = this.isConnected;
    this.isConnected = false;
    this.ws = null;

    this.callbacks.onConnectionChange?.('disconnected');

    // Attempt reconnect only if close was unexpected
    if (!this.intentionalClose && wasConnected) {
      this.attemptReconnect();
    }
  }

  /**
   * Handle WebSocket error event
   */
  private handleError(event: Event, rejectFn?: (reason: Error) => void): void {
    const errorMessage = 'WebSocket connection error';

    // Only call onError callback if we were connected
    // Initial connection errors are handled via the promise rejection
    if (this.isConnected) {
      this.callbacks.onError?.(errorMessage);
    }

    // If we have a reject function (initial connection), call it
    if (rejectFn && !this.isConnected) {
      rejectFn(new Error(errorMessage));
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   */
  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('Max reconnect attempts reached, giving up');
      this.callbacks.onError?.('Connection lost. Max reconnect attempts reached.');
      return;
    }

    // Calculate delay with exponential backoff: 1s, 2s, 4s, 8s, 16s
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 16000);
    this.reconnectAttempts++;

    console.log(`Attempting reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(async () => {
      try {
        await this.connect();
      } catch (error) {
        // connect() will trigger handleClose on failure, which will call attemptReconnect again
        console.error('Reconnect attempt failed:', error);
      }
    }, delay);
  }

  /**
   * Send a message through the WebSocket
   * @param content The message content to send
   */
  sendMessage(content: string): void {
    if (!this.ws || !this.isConnected) {
      console.error('Cannot send message: WebSocket is not connected');
      this.callbacks.onError?.('Cannot send message: not connected');
      return;
    }

    const message: OutgoingMessage = {
      type: 'message',
      content,
    };

    try {
      this.ws.send(JSON.stringify(message));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to send message';
      console.error('Failed to send WebSocket message:', error);
      this.callbacks.onError?.(errorMessage);
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  disconnect(): void {
    this.intentionalClose = true;

    // Clear any pending reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    // Reset reconnect attempts
    this.reconnectAttempts = 0;

    // Close the WebSocket connection gracefully
    if (this.ws) {
      if (this.isConnected) {
        this.ws.close(1000, 'Client disconnecting');
      }
      this.ws = null;
    }

    this.isConnected = false;
    this.callbacks.onConnectionChange?.('disconnected');
  }

  /**
   * Set callback functions for WebSocket events
   * @param callbacks Object containing callback functions
   */
  setCallbacks(callbacks: ChatCallbacks): void {
    this.callbacks = { ...callbacks };
  }

  /**
   * Check if the WebSocket is currently connected
   */
  getIsConnected(): boolean {
    return this.isConnected;
  }
}
