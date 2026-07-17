/**
 * Canonical set of Notification.type values (3.6).
 *
 * SINGLE SOURCE OF TRUTH — every place that emits a notification must use one of
 * these, and the FE icon mapping (app/notifications/page.tsx) is keyed off this
 * list. If you add a new notification kind, add it here first.
 *
 * Verified against actual emitters (2026-07):
 *  - viewing_request    → client asked for a viewing            (api/viewings, viewing/schedule)
 *  - viewing_proposed   → agent proposed a new time             (api/viewings/[id]/propose)
 *  - viewing_confirmed  → viewing confirmed                     (api/viewings/[id]/approve)
 *  - viewing_cancelled  → viewing cancelled                     (api/viewings/[id]/cancel)
 *  - listing_approved   → moderator approved a listing          (api/admin/listings/[id]/approve)
 *  - listing_rejected   → moderator rejected a listing          (api/admin/listings/[id]/reject)
 *  - chat_new           → a new conversation started            (api/chats)
 *  - chat_message       → a new message in a conversation       (api/chats/[id]/messages)
 *  - chat_assigned      → support conversation assigned         (api/support/assign/[id])
 *  - saved_search_match → a saved search matched a new listing  (savedSearchMatcher)
 *  - system             → generic/system + admin broadcast      (api/admin/notifications)
 */
export const NOTIFICATION_TYPES = [
  'viewing_request',
  'viewing_proposed',
  'viewing_confirmed',
  'viewing_cancelled',
  'listing_approved',
  'listing_rejected',
  'chat_new',
  'chat_message',
  'chat_assigned',
  'saved_search_match',
  'system',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

/**
 * Semantic category for FE styling/icons. Keeps the icon switch small and lets
 * several concrete types share one icon (e.g. all chat_* → 'chat').
 */
export type NotificationCategory =
  | 'viewing'      // requested / proposed — neutral calendar
  | 'viewing_good' // confirmed — positive calendar
  | 'viewing_bad'  // cancelled — negative calendar
  | 'listing_good' // approved
  | 'listing_bad'  // rejected
  | 'chat'         // any chat_*
  | 'search'       // saved_search_match
  | 'system';      // system / fallback

export function notificationCategory(type: string): NotificationCategory {
  switch (type) {
    case 'viewing_request':
    case 'viewing_proposed':
      return 'viewing';
    case 'viewing_confirmed':
      return 'viewing_good';
    case 'viewing_cancelled':
      return 'viewing_bad';
    case 'listing_approved':
      return 'listing_good';
    case 'listing_rejected':
      return 'listing_bad';
    case 'chat_new':
    case 'chat_message':
    case 'chat_assigned':
      return 'chat';
    case 'saved_search_match':
      return 'search';
    default:
      return 'system';
  }
}
