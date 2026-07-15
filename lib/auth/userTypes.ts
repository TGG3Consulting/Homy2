/**
 * user_type values a user is allowed to set on THEMSELVES (self-service).
 *
 * Privileged types are intentionally excluded:
 *  - 'admin'      → admin is governed by the `role` column, granted only via
 *                   the admin panel (change_role) or seed. `user_type='admin'`
 *                   must never be self-assignable (it flips client-side admin gating).
 *  - 'consultant' → support-desk access is gated on `user_type==='consultant'`
 *                   (support inbox / assign). Consultants are staff, provisioned
 *                   via seed/DB/admin tooling — never by self-service, otherwise any
 *                   user could read the whole support inbox and assign themselves
 *                   to other users' conversations.
 *
 * Use this everywhere a user updates their own user_type (settings / preferences).
 */
export const SELF_ASSIGNABLE_USER_TYPES = ['buyer', 'renter', 'owner', 'agent'] as const;

export type SelfAssignableUserType = (typeof SELF_ASSIGNABLE_USER_TYPES)[number];

/** True if `v` is a user_type a user may set on themselves. */
export function isSelfAssignableUserType(v: unknown): v is SelfAssignableUserType {
  return typeof v === 'string' && (SELF_ASSIGNABLE_USER_TYPES as readonly string[]).includes(v);
}
