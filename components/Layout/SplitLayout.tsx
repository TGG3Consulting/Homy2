'use client';

import { useState, useEffect, useCallback, ReactNode } from 'react';
import Image from 'next/image';

interface SplitLayoutProps {
  /** Whether split mode is active */
  isActive: boolean;
  /** Chat sidebar content */
  chatContent: ReactNode;
  /** Main content */
  children: ReactNode;
  /** Callback when chat visibility changes */
  onChatToggle?: (isVisible: boolean) => void;
}

type MobileView = 'content' | 'chat';

export default function SplitLayout({
  isActive,
  chatContent,
  children,
  onChatToggle,
}: SplitLayoutProps) {
  // Chat visibility state (can be hidden even when split is active)
  const [isChatVisible, setIsChatVisible] = useState(true);
  // Mobile view mode
  const [mobileView, setMobileView] = useState<MobileView>('content');
  // Track if we're on mobile
  const [isMobile, setIsMobile] = useState(false);
  // Touch handling for swipe
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  // Minimum swipe distance for gesture
  const minSwipeDistance = 50;

  // Check screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Reset chat visibility when split mode activates
  useEffect(() => {
    if (isActive) {
      setIsChatVisible(true);
    }
  }, [isActive]);

  // Handle chat toggle
  const toggleChat = useCallback(() => {
    const newState = !isChatVisible;
    setIsChatVisible(newState);
    onChatToggle?.(newState);
  }, [isChatVisible, onChatToggle]);

  // Touch handlers for swipe gesture (mobile)
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && mobileView === 'content') {
      setMobileView('chat');
    } else if (isRightSwipe && mobileView === 'chat') {
      setMobileView('content');
    }
  };

  // If split mode is not active, render only children
  if (!isActive) {
    return <>{children}</>;
  }

  // Mobile layout with tabs and swipe
  if (isMobile) {
    return (
      <div className="flex flex-col h-screen overflow-hidden">
        {/* Mobile tabs */}
        <div className="flex bg-white border-b border-gray-200 shadow-sm">
          <button
            onClick={() => setMobileView('content')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors duration-200 ${
              mobileView === 'content'
                ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                />
              </svg>
              Content
            </div>
          </button>
          <button
            onClick={() => setMobileView('chat')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors duration-200 ${
              mobileView === 'chat'
                ? 'text-emerald-600 border-b-2 border-emerald-500 bg-emerald-50'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              Chat
            </div>
          </button>
        </div>

        {/* Swipeable content area */}
        <div
          className="flex-1 overflow-hidden relative"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div
            className="absolute inset-0 flex transition-transform duration-300 ease-out"
            style={{
              transform: `translateX(${mobileView === 'chat' ? '-100%' : '0'})`,
              width: '200%',
            }}
          >
            {/* Content panel */}
            <div className="w-1/2 h-full overflow-auto">{children}</div>
            {/* Chat panel */}
            <div className="w-1/2 h-full overflow-auto bg-white">
              {chatContent}
            </div>
          </div>
        </div>

        {/* Swipe indicator */}
        <div className="flex justify-center py-2 bg-white border-t border-gray-100">
          <div className="flex gap-1.5">
            <div
              className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                mobileView === 'content' ? 'bg-emerald-500' : 'bg-gray-300'
              }`}
            />
            <div
              className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                mobileView === 'chat' ? 'bg-emerald-500' : 'bg-gray-300'
              }`}
            />
          </div>
        </div>
      </div>
    );
  }

  // Desktop layout with split view
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Main content - 70% or 100% when chat is hidden */}
      <div
        className={`
          h-full overflow-auto
          transition-all duration-300 ease-out
          ${isChatVisible ? 'w-[70%]' : 'w-full'}
        `}
      >
        {children}
      </div>

      {/* Toggle button - positioned at the edge */}
      <button
        onClick={toggleChat}
        className={`
          absolute z-20 top-1/2 -translate-y-1/2
          w-6 h-16 bg-white border border-gray-200
          shadow-md hover:shadow-lg
          rounded-l-lg
          flex items-center justify-center
          transition-all duration-300 ease-out
          hover:bg-gray-50
          group
          ${isChatVisible ? 'right-[30%]' : 'right-0'}
        `}
        aria-label={isChatVisible ? 'Hide chat' : 'Show chat'}
      >
        <svg
          className={`
            w-4 h-4 text-gray-500 group-hover:text-emerald-600
            transition-transform duration-300
            ${isChatVisible ? 'rotate-0' : 'rotate-180'}
          `}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 5l7 7-7 7"
          />
        </svg>
      </button>

      {/* Chat sidebar - 30% with slide animation */}
      <div
        className={`
          h-full bg-white border-l border-gray-200
          shadow-lg
          transition-all duration-300 ease-out
          overflow-hidden
          ${isChatVisible ? 'w-[30%] opacity-100' : 'w-0 opacity-0'}
        `}
      >
        <div
          className={`
            h-full w-full min-w-[300px]
            transition-transform duration-300 ease-out
            ${isChatVisible ? 'translate-x-0' : 'translate-x-full'}
          `}
        >
          {/* Chat header */}
          <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <Image
                src="/logo/homy_mono_white.svg"
                alt="Homy"
                width={20}
                height={20}
                className="select-none"
              />
              <span className="font-semibold">Homy Chat</span>
            </div>
            <button
              onClick={toggleChat}
              className="p-1 rounded hover:bg-white/20 transition-colors"
              aria-label="Close chat"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          {/* Chat content */}
          <div className="h-[calc(100%-56px)] overflow-auto">{chatContent}</div>
        </div>
      </div>
    </div>
  );
}
