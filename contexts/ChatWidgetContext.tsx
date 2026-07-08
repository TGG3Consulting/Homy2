'use client';
import React, { createContext, useContext, useState, useCallback } from 'react';

interface ChatWidgetContextType {
  isOpen: boolean;
  conversationId: string | null;
  chatType: 'support' | 'property' | null;
  propertyId: string | null;
  openSupportChat: () => void;
  openPropertyChat: (propertyId: string) => void;
  closeChat: () => void;
  setConversationId: (id: string) => void;
}

const ChatWidgetContext = createContext<ChatWidgetContextType | null>(null);

export function ChatWidgetProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [chatType, setChatType] = useState<'support' | 'property' | null>(null);
  const [propertyId, setPropertyId] = useState<string | null>(null);

  const openSupportChat = useCallback(() => {
    setChatType('support');
    setPropertyId(null);
    setIsOpen(true);
  }, []);

  const openPropertyChat = useCallback((propId: string) => {
    setChatType('property');
    setPropertyId(propId);
    setIsOpen(true);
  }, []);

  const closeChat = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <ChatWidgetContext.Provider value={{
      isOpen,
      conversationId,
      chatType,
      propertyId,
      openSupportChat,
      openPropertyChat,
      closeChat,
      setConversationId,
    }}>
      {children}
    </ChatWidgetContext.Provider>
  );
}

export function useChatWidget() {
  const context = useContext(ChatWidgetContext);
  if (!context) {
    throw new Error('useChatWidget must be used within ChatWidgetProvider');
  }
  return context;
}
