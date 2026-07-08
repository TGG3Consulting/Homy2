import { ChatMessage } from './types';
import { v4 as uuidv4 } from 'uuid';

export class ChatService {
  private controller: AbortController | null = null;
  private sessionId: string;

  constructor() {
    // Generate unique session ID for this chat instance
    this.sessionId = this.getOrCreateSessionId();
  }

  private getOrCreateSessionId(): string {
    // Try to get from sessionStorage (persists during page refreshes)
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('homy_session_id');
      if (stored) {
        return stored;
      }

      // Generate new session ID
      const newSessionId = uuidv4();
      sessionStorage.setItem('homy_session_id', newSessionId);
      return newSessionId;
    }

    // Fallback for SSR
    return uuidv4();
  }

  async sendMessage(
    messages: ChatMessage[],
    onChunk: (chunk: string) => void,
    onComplete: (fullMessage: string) => void,
    onError: (error: string) => void
  ): Promise<void> {
    this.controller = new AbortController();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages,
          sessionId: this.sessionId
        }),
        signal: this.controller.signal,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        onError(errorData.error || `HTTP error! status: ${response.status}`);
        return;
      }

      const reader = response.body?.getReader();
      if (!reader) {
        onError('No response body');
        return;
      }

      const decoder = new TextDecoder();
      let buffer = '';
      let fullMessage = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;

          try {
            const data = JSON.parse(line.slice(6));

            if (data.type === 'message') {
              fullMessage += data.content;
              onChunk(data.content);
            } else if (data.type === 'error') {
              onError(data.error || 'An error occurred');
              return;
            } else if (data.type === 'done') {
              onComplete(fullMessage);
              return;
            }
          } catch (parseError) {
            console.error('Failed to parse SSE data:', line, parseError);
          }
        }
      }

      onComplete(fullMessage);
    } catch (error: any) {
      if (error.name === 'AbortError') {
        onError('Request was cancelled');
      } else {
        onError(error.message || 'Failed to send message');
      }
    }
  }

  abort(): void {
    this.controller?.abort();
    this.controller = null;
  }

  // Cleanup session when chat is closed
  async cleanup(): Promise<void> {
    try {
      await fetch(`/api/chat?sessionId=${this.sessionId}`, {
        method: 'DELETE',
      });

      // Clear session ID from storage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('homy_session_id');
      }
    } catch (error) {
      console.error('Failed to cleanup session:', error);
    }
  }

  getSessionId(): string {
    return this.sessionId;
  }
}
