/**
 * Anthropic Claude API Client for Homy
 * Replaces CLI subprocess spawning with direct API calls
 */

import Anthropic from '@anthropic-ai/sdk';
import { HOMY_SYSTEM_PROMPT, buildPropertyChatPrompt, buildPropertyOpinionPrompt } from './homySystemPrompt';
import { HOMY_TOOLS, executeToolCall, ToolName, PropertyShowResult } from './toolHandlers';

// ============================================
// TYPES
// ============================================

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AgentResponse {
  text: string;
  showPropertiesData?: PropertyShowResult;
}

interface ContentBlock {
  type: string;
  text?: string;
  id?: string;
  name?: string;
  input?: any;
}

// ============================================
// ANTHROPIC CLIENT SINGLETON
// ============================================

let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('ANTHROPIC_API_KEY environment variable is not set');
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

// ============================================
// AGENTIC LOOP
// ============================================

const MAX_ITERATIONS = 10;
const MODEL = 'claude-sonnet-4-6';

/**
 * Run the agentic loop with tool calling
 */
export async function runAgentLoop(
  messages: Array<{ role: 'user' | 'assistant'; content: any }>,
  systemPrompt: string = HOMY_SYSTEM_PROMPT
): Promise<AgentResponse> {
  const client = getAnthropicClient();
  let currentMessages = [...messages];
  let iterations = 0;
  let lastShowPropertiesData: PropertyShowResult | undefined;

  while (iterations < MAX_ITERATIONS) {
    iterations++;
    console.log(`[AnthropicClient] Iteration ${iterations}/${MAX_ITERATIONS}`);

    try {
      const response = await client.messages.create({
        model: MODEL,
        max_tokens: 4096,
        system: systemPrompt,
        tools: HOMY_TOOLS as any,
        messages: currentMessages,
      });

      console.log(`[AnthropicClient] Response stop_reason: ${response.stop_reason}`);

      // If end_turn — extract text and return
      if (response.stop_reason === 'end_turn') {
        const text = extractTextContent(response.content as ContentBlock[]);
        return { text, showPropertiesData: lastShowPropertiesData };
      }

      // If tool_use — execute tools and continue loop
      if (response.stop_reason === 'tool_use') {
        const toolResults: Array<{ type: 'tool_result'; tool_use_id: string; content: string }> = [];

        for (const block of response.content as ContentBlock[]) {
          if (block.type === 'tool_use' && block.id && block.name) {
            console.log(`[AnthropicClient] Executing tool: ${block.name}`);

            const { result, showPropertiesData } = await executeToolCall(
              block.name as ToolName,
              block.input || {}
            );

            // Track show_properties data for returning to caller
            if (showPropertiesData) {
              lastShowPropertiesData = showPropertiesData;
            }

            // Ensure result is never empty/undefined - API requires non-empty content
            const safeResult = result !== undefined && result !== null
              ? result
              : { message: 'no results' };

            const contentString = JSON.stringify(safeResult);

            toolResults.push({
              type: 'tool_result',
              tool_use_id: block.id,
              content: contentString || '{"message":"no results"}',
            });
          }
        }

        // Add assistant response and tool results to messages
        currentMessages.push({ role: 'assistant', content: response.content });

        // Only add tool results if array is not empty
        if (toolResults.length > 0) {
          currentMessages.push({ role: 'user', content: toolResults });
        }

        continue;
      }

      // Unknown stop reason — return what we have
      console.warn(`[AnthropicClient] Unknown stop_reason: ${response.stop_reason}`);
      const text = extractTextContent(response.content as ContentBlock[]);
      return { text: text || 'Не удалось получить ответ', showPropertiesData: lastShowPropertiesData };

    } catch (error) {
      console.error(`[AnthropicClient] API error:`, error);
      throw error;
    }
  }

  // Max iterations reached
  console.warn(`[AnthropicClient] Max iterations (${MAX_ITERATIONS}) reached`);
  return {
    text: 'Извините, запрос занял слишком много времени. Попробуйте упростить вопрос.',
    showPropertiesData: lastShowPropertiesData
  };
}

/**
 * Extract text content from response blocks
 */
function extractTextContent(content: ContentBlock[]): string {
  const textBlocks = content.filter(block => block.type === 'text' && block.text);
  return textBlocks.map(block => block.text).join('\n');
}

// ============================================
// SIMPLE CHAT (NO TOOLS)
// ============================================

/**
 * Simple chat without tools (for property-specific chats)
 */
export async function simpleChat(
  prompt: string,
  systemPrompt?: string
): Promise<string> {
  const client = getAnthropicClient();

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt || 'Ты полезный AI-ассистент.',
      messages: [{ role: 'user', content: prompt }],
    });

    return extractTextContent(response.content as ContentBlock[]);
  } catch (error) {
    console.error(`[AnthropicClient] Simple chat error:`, error);
    throw error;
  }
}

/**
 * Property chat - answer questions about specific property
 */
export async function propertyChat(
  property: Parameters<typeof buildPropertyChatPrompt>[0],
  conversationHistory: string,
  chatHistory: string,
  userMessage: string
): Promise<string> {
  const prompt = buildPropertyChatPrompt(property, conversationHistory, chatHistory, userMessage);
  return simpleChat(prompt);
}

/**
 * Property opinion - generate AI opinion about property
 */
export async function propertyOpinion(
  property: Parameters<typeof buildPropertyOpinionPrompt>[0],
  conversationHistory: string,
  intel?: Parameters<typeof buildPropertyOpinionPrompt>[2]
): Promise<{ summary: string; reasons: string[]; warning: string | null }> {
  const prompt = buildPropertyOpinionPrompt(property, conversationHistory, intel);

  try {
    const response = await simpleChat(prompt);

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*?"summary"[\s\S]*?\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        summary: parsed.summary || '',
        reasons: parsed.reasons || [],
        warning: parsed.warning || null,
      };
    }

    return { summary: 'Не удалось получить анализ', reasons: [], warning: null };
  } catch (error) {
    console.error(`[AnthropicClient] Property opinion error:`, error);
    return { summary: 'Ошибка анализа', reasons: [], warning: null };
  }
}

// ============================================
// SESSION MANAGER CLASS
// ============================================

interface Session {
  sessionId: string;
  messageHistory: ChatMessage[];
  lastActivity: number;
}

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
const MAX_HISTORY_MESSAGES = 20; // Keep last 20 messages

class AnthropicSessionManager {
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

  addMessage(sessionId: string, role: 'user' | 'assistant', content: string) {
    const session = this.getOrCreateSession(sessionId);
    session.messageHistory.push({ role, content });

    // Keep only last N messages
    if (session.messageHistory.length > MAX_HISTORY_MESSAGES) {
      session.messageHistory = session.messageHistory.slice(-MAX_HISTORY_MESSAGES);
    }
  }

  /**
   * Send message and get response using agentic loop
   */
  async sendMessage(sessionId: string, userMessage: string): Promise<AgentResponse> {
    const session = this.getOrCreateSession(sessionId);

    // Add user message to history
    this.addMessage(sessionId, 'user', userMessage);

    // Build messages array for API
    const messages = session.messageHistory.map(msg => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));

    // Run agentic loop
    const response = await runAgentLoop(messages);

    // Add assistant response to history
    if (response.text) {
      this.addMessage(sessionId, 'assistant', response.text);
    }

    return response;
  }

  destroySession(sessionId: string) {
    if (this.sessions.has(sessionId)) {
      console.log(`[SessionManager] Destroying session: ${sessionId}`);
      this.sessions.delete(sessionId);
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
      this.destroySession(sessionId);
    }
  }

  shutdown() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.sessions.clear();
  }
}

// Singleton instance
export const anthropicSessionManager = new AnthropicSessionManager();

// Cleanup on process exit
if (typeof process !== 'undefined') {
  process.on('SIGINT', () => anthropicSessionManager.shutdown());
  process.on('SIGTERM', () => anthropicSessionManager.shutdown());
}
