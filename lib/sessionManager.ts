/**
 * Session Manager for HomLy AI Chat
 * Uses Claude API via anthropicClient
 */

import { anthropicSessionManager, AgentResponse } from './anthropicClient';

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface Session {
  sessionId: string;
  messageHistory: ChatMessage[];
  lastActivity: number;
}

class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Cleanup inactive sessions every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveSessions();
    }, 5 * 60 * 1000);
  }

  getOrCreateSession(sessionId: string): Session {
    let session = this.sessions.get(sessionId);

    if (!session) {
      console.log(`[SessionManager] Creating new session: ${sessionId}`);
      session = {
        sessionId,
        messageHistory: [],
        lastActivity: Date.now(),
      };
      this.sessions.set(sessionId, session);
    } else {
      session.lastActivity = Date.now();
    }

    return session;
  }

  addMessageToHistory(sessionId: string, role: 'user' | 'assistant', content: string) {
    const session = this.getOrCreateSession(sessionId);
    session.messageHistory.push({ role, content });

    // Keep only last 20 messages in history (10 exchanges)
    if (session.messageHistory.length > 20) {
      session.messageHistory = session.messageHistory.slice(-20);
    }
  }

  /**
   * Send message using Claude API (via anthropicClient)
   */
  async sendMessage(
    sessionId: string,
    userMessage: string,
    controller: ReadableStreamDefaultController
  ): Promise<void> {
    const encoder = new TextEncoder();

    try {
      console.log(`[SessionManager] Sending message for session ${sessionId}`);

      // Use anthropicSessionManager which handles:
      // - Message history
      // - Agentic loop with tools
      // - show_properties tool calls
      const response: AgentResponse = await anthropicSessionManager.sendMessage(
        sessionId,
        userMessage
      );

      // Send properties_update if show_properties was called
      if (response.showPropertiesData && response.showPropertiesData.properties.length > 0) {
        const propertiesEvent = {
          type: 'properties_update',
          data: {
            properties: response.showPropertiesData.properties,
            top_choice: response.showPropertiesData.top_choice_id,
            criteria: response.showPropertiesData.criteria,
          }
        };

        if (controller.desiredSize !== null) {
          controller.enqueue(
            encoder.encode(`event: properties_update\ndata: ${JSON.stringify(propertiesEvent)}\n\n`)
          );
          console.log(`[SessionManager] Sent properties_update with ${response.showPropertiesData.properties.length} properties`);
        }
      }

      // Send text response
      if (response.text) {
        const messageData = {
          type: 'message',
          content: response.text
        };

        if (controller.desiredSize !== null) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(messageData)}\n\n`)
          );
        }

        // Also update local history (anthropicSessionManager has its own)
        this.addMessageToHistory(sessionId, 'user', userMessage);
        this.addMessageToHistory(sessionId, 'assistant', response.text);
      }

      // Send done event
      if (controller.desiredSize !== null) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: 'done' })}\n\n`)
        );
        controller.close();
      }

    } catch (error) {
      console.error(`[SessionManager] Error for session ${sessionId}:`, error);

      // Generic message only (VULN-010): don't leak SDK/upstream error detail.
      const errorData = {
        type: 'error',
        error: 'Failed to get response'
      };

      try {
        if (controller.desiredSize !== null) {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(errorData)}\n\n`)
          );
          controller.close();
        }
      } catch (e) {
        // Ignore controller errors
      }

      throw error;
    }
  }

  cleanupSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (session) {
      console.log(`[SessionManager] Cleaning up session: ${sessionId} (${session.messageHistory.length} messages)`);
      this.sessions.delete(sessionId);
      // Also cleanup in anthropicSessionManager
      anthropicSessionManager.destroySession(sessionId);
    }
  }

  private cleanupInactiveSessions() {
    const now = Date.now();
    const toDelete: string[] = [];

    for (const [sessionId, session] of this.sessions.entries()) {
      if (now - session.lastActivity > SESSION_TIMEOUT) {
        toDelete.push(sessionId);
      }
    }

    for (const sessionId of toDelete) {
      console.log(`[SessionManager] Cleaning up inactive session: ${sessionId}`);
      this.cleanupSession(sessionId);
    }
  }

  shutdown() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.sessions.clear();
    anthropicSessionManager.shutdown();
  }
}

// Singleton instance
export const sessionManager = new SessionManager();

// Cleanup on process exit
if (typeof process !== 'undefined') {
  process.on('SIGINT', () => sessionManager.shutdown());
  process.on('SIGTERM', () => sessionManager.shutdown());
}
