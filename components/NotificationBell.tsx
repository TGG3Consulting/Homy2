'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

// ============================================
// Types
// ============================================
interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  read: boolean;
  createdAt: string;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  hasMore: boolean;
  total: number;
}

// ============================================
// Icons (inline SVG for simplicity)
// ============================================
function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function XCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6" />
      <path d="m9 9 6 6" />
    </svg>
  );
}

function HomeIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function MessageIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

// ============================================
// Notification Type Config
// ============================================
type IconComponent = ({ className }: { className?: string }) => React.ReactElement;

const typeIcons: Record<string, IconComponent> = {
  viewing_request: EyeIcon,
  viewing_approved: CheckCircleIcon,
  viewing_rejected: XCircleIcon,
  listing_approved: HomeIcon,
  listing_rejected: XCircleIcon,
  message: MessageIcon,
  system: BellIcon,
};

const typeColors: Record<string, string> = {
  viewing_request: 'text-blue-500 bg-blue-100 dark:bg-blue-900/30',
  viewing_approved: 'text-green-500 bg-green-100 dark:bg-green-900/30',
  viewing_rejected: 'text-red-500 bg-red-100 dark:bg-red-900/30',
  listing_approved: 'text-green-500 bg-green-100 dark:bg-green-900/30',
  listing_rejected: 'text-red-500 bg-red-100 dark:bg-red-900/30',
  message: 'text-emerald-500 bg-emerald-100 dark:bg-emerald-900/30',
  system: 'text-gray-500 bg-gray-100 dark:bg-gray-700',
};

// ============================================
// Utility Functions
// ============================================
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return 'just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return `${diffInDays}d ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return `${diffInWeeks}w ago`;
  }

  return date.toLocaleDateString();
}

function getNotificationLink(notification: Notification): string | null {
  const data = notification.data as Record<string, string> | null | undefined;

  switch (notification.type) {
    case 'viewing_request':
    case 'viewing_approved':
    case 'viewing_rejected':
      if (data?.viewingId) {
        return `/viewings/${data.viewingId}`;
      }
      if (data?.propertyId) {
        return `/properties/${data.propertyId}`;
      }
      return null;

    case 'listing_approved':
    case 'listing_rejected':
      if (data?.listingId) {
        return `/my-listings/${data.listingId}`;
      }
      return null;

    case 'message':
      if (data?.conversationId) {
        return `/messages/${data.conversationId}`;
      }
      return null;

    default:
      return null;
  }
}

// ============================================
// NotificationBell Component
// ============================================
export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [state, setState] = useState<NotificationsState>({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    hasMore: false,
    total: 0,
  });
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications?limit=1&offset=0', {
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setState((prev) => ({ ...prev, unreadCount: data.unreadCount }));
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, []);

  // Fetch notifications
  const fetchNotifications = useCallback(
    async (offset = 0) => {
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const res = await fetch(
          `/api/notifications?offset=${offset}&limit=20`,
          {
            credentials: 'include',
          }
        );

        if (res.ok) {
          const data = await res.json();
          setState((prev) => ({
            notifications:
              offset === 0
                ? data.notifications
                : [...prev.notifications, ...data.notifications],
            unreadCount: data.unreadCount,
            hasMore: data.hasMore,
            total: data.total,
            isLoading: false,
          }));
        }
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    },
    []
  );

  // Mark single notification as read
  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        const res = await fetch(`/api/notifications/${notificationId}/read`, {
          method: 'POST',
          credentials: 'include',
        });

        if (res.ok) {
          setState((prev) => ({
            ...prev,
            notifications: prev.notifications.map((n) =>
              n.id === notificationId ? { ...n, read: true } : n
            ),
            unreadCount: Math.max(0, prev.unreadCount - 1),
          }));
        }
      } catch (error) {
        console.error('Failed to mark as read:', error);
      }
    },
    []
  );

  // Mark all notifications as read
  const markAllAsRead = useCallback(async () => {
    try {
      const res = await fetch('/api/notifications/read-all', {
        method: 'POST',
        credentials: 'include',
      });

      if (res.ok) {
        setState((prev) => ({
          ...prev,
          notifications: prev.notifications.map((n) => ({ ...n, read: true })),
          unreadCount: 0,
        }));
      }
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }, []);

  // Poll for unread count every 30 seconds
  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [fetchUnreadCount]);

  // Fetch notifications when dropdown opens
  useEffect(() => {
    if (isOpen) {
      fetchNotifications(0);
    }
  }, [isOpen, fetchNotifications]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle notification click
  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative"
        aria-label={`Notifications${state.unreadCount > 0 ? ` (${state.unreadCount} unread)` : ''}`}
      >
        <BellIcon className="h-5 w-5" />
        {state.unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
            {state.unreadCount > 99 ? '99+' : state.unreadCount}
          </span>
        )}
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <div
          className={cn(
            'absolute right-0 mt-2 w-80 sm:w-96',
            'bg-white dark:bg-gray-800 rounded-lg shadow-lg',
            'border border-gray-200 dark:border-gray-700',
            'z-50 max-h-[70vh] overflow-hidden',
            'flex flex-col'
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">
              Notifications
            </h3>
            {state.unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Mark all as read
              </Button>
            )}
          </div>

          {/* Notification List */}
          <div className="overflow-y-auto max-h-[400px]">
            {state.notifications.length === 0 && !state.isLoading ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <BellIcon className="h-12 w-12 text-gray-300 mb-3" />
                <p className="text-gray-500 text-sm">No notifications yet</p>
              </div>
            ) : (
              <>
                {state.notifications.map((notification) => {
                  const Icon = typeIcons[notification.type] || BellIcon;
                  const colorClass =
                    typeColors[notification.type] || typeColors.system;
                  const link = getNotificationLink(notification);

                  const content = (
                    <div
                      className={cn(
                        'flex gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors',
                        !notification.read && 'bg-blue-50 dark:bg-blue-900/20'
                      )}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div
                        className={cn(
                          'flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center',
                          colorClass
                        )}
                      >
                        <Icon className="h-5 w-5" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={cn(
                              'text-sm',
                              notification.read
                                ? 'text-gray-600 dark:text-gray-400'
                                : 'text-gray-900 dark:text-white font-medium'
                            )}
                          >
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <span className="flex-shrink-0 w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                          {notification.body}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatRelativeTime(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  );

                  if (link) {
                    return (
                      <Link
                        key={notification.id}
                        href={link}
                        onClick={() => setIsOpen(false)}
                      >
                        {content}
                      </Link>
                    );
                  }

                  return <div key={notification.id}>{content}</div>;
                })}

                {/* Load More */}
                {state.hasMore && (
                  <div className="p-3 text-center border-t border-gray-200 dark:border-gray-700">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        fetchNotifications(state.notifications.length)
                      }
                      disabled={state.isLoading}
                    >
                      {state.isLoading ? 'Loading...' : 'Load more'}
                    </Button>
                  </div>
                )}

                {/* Loading State */}
                {state.isLoading && state.notifications.length === 0 && (
                  <div className="flex items-center justify-center py-8">
                    <div className="animate-spin rounded-full h-6 w-6 border-2 border-blue-500 border-t-transparent" />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationBell;
