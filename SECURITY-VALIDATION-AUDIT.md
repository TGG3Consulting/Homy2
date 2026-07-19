# Input Validation Audit — Homly (VULN-022)

**Date:** 2026-07-18 · **Scope:** all 55 write endpoints (POST/PATCH/PUT/DELETE) under `app/api/**`
**Finding:** a full zod schema layer exists in `lib/validations/**` but is wired into **only 1** route (`auth/register`). Every other write route validates by hand — ranging from solid to absent. This is a systemic *consistency* gap (CWE-20 / OWASP A03), not a single hole.

## Goal / definition of "passes a cyber audit"

Every endpoint that accepts a request body must:
1. Parse the body through a **declared schema** (`schema.safeParse(body)`), returning **400** with field errors on failure — never trust raw `req.json()`.
2. Enforce **type + bounds** on every field (numbers finite & ranged, strings length-capped, enums whitelisted, arrays size-capped).
3. **Never** persist a field the client shouldn't control (mass-assignment): the schema is the allow-list.
4. Be the *single* source of truth: FE and BE import the same schema.

## Recommended architecture (production)

- One schema per route body in `lib/validations/schemas/<domain>.ts`, composed from shared primitives in `common.ts` (e.g. `zPositiveInt`, `zMoney`, `zText(max)`, `zCuid`, `zEmail`, `zEnum`).
- A tiny helper `validateBody(schema, req)` → `{ ok, data } | { ok:false, response }` so each handler is 2 lines:
  ```ts
  const v = await validateBody(createViewingSchema, req);
  if (!v.ok) return v.response;            // 400 with field errors
  const { propertyId, scheduledAt } = v.data;
  ```
- Enums (`user_type`, `deal_type`, `status`, `stage`, `rating`) as `z.enum([...])` — reject anything off-list.
- `.strict()` on every object schema so unknown keys are rejected (kills mass-assignment by default).

---

## Per-route inventory (body-parsing routes)

Legend — **State**: ✅ hardened this session · 🟡 partial/manual · ❌ none.

### Auth (trust boundary: fully anonymous — highest priority)
| Route | Business purpose | State | Gap → schema |
|---|---|---|---|
| `auth/register` | Create account | ✅ zod | Already schema-validated — reference implementation. |
| `auth/login` | Issue tokens | 🟡 | Has rate-limit; validate `{email: zEmail, password: z.string().min(1).max(200)}`. |
| `auth/verify-otp` | Confirm email/login | 🟡 | `{email:zEmail, otpCode: z.string().length(6).regex(/^\d+$/)}` — reject non-numeric/oversized. |
| `auth/resend-otp` | Resend code | 🟡 | `{email:zEmail}`; rate-limit present. |
| `auth/reset-password-request` | Start reset | 🟡 | `{email:zEmail}`. |
| `auth/reset-password` | Set new password | 🟡 | `{resetToken: z.string().length(64).regex(hex), newPassword: strongPw}` — enforce token shape + password policy. |

### Users / profile (authenticated, self-scoped)
| Route | Purpose | State | Gap → schema |
|---|---|---|---|
| `users/me` PATCH | Edit own profile / change password | 🟡 | Whitelists fields manually (good — mass-assignment closed). Formalize: `{first_name:zText(100), last_name:zText(100), phone: zPhone, language_preference: z.enum(['en','ru','hy']), current_password, new_password: strongPw, search_preferences: prefsSchema}.strict()`. |
| `users/me/avatar` POST | Upload avatar | ✅ | Magic-byte + size + sniffed-ext done. |
| `users/me/favorites` POST/DELETE | Add/remove favorite | ❌ | `{propertyId: zCuidOrUuid}` — currently trusts body id. |
| `users/me/saved-searches` POST, `[id]` PATCH/PUT/DELETE | Save/update a search | ❌ | Validate the search-criteria JSON shape (districts[]≤N, budget ints ≥0, rooms ints) + `[id]` ownership (present). Unbounded criteria JSON stored today. |

### Properties / listings
| Route | Purpose | State | Gap → schema |
|---|---|---|---|
| `properties/list` POST | Owner submits a listing → moderation | ✅ | price/area/rooms/floor bounds + text caps done this session. Move into `createListingSchema.strict()`. |
| `properties/[id]` PATCH/DELETE | Owner/admin edit/unpublish | 🟡 | Ownership ✅. Body fields (price, area, rooms, description, images, dealType, propertyType) need the same numeric bounds + enum(`dealType`,`propertyType`) + text caps as create. Currently partial. |
| `properties/listings/[id]` PATCH/DELETE | Moderator edit before approve | 🟡 | Same numeric/enum bounds as create; admin override ✅. |
| `admin/listings/[id]/approve` | Publish listing | ✅ | Re-validation added this session. |
| `admin/listings/[id]/reject` | Reject with reason | 🟡 | `{reason: zText(1..1000)}` — enforce min length. |

### Viewings
| Route | Purpose | State | Gap → schema |
|---|---|---|---|
| `viewings` POST | Client requests / owner creates | ✅ | Serializable tx + owner check + status this session. Formalize `{propertyId:zId, scheduledAt: z.coerce.date().min(now), message: zText(2000).optional(), clientEmail?:zEmail, clientId?:zId}.strict()`. |
| `viewings/[id]/cancel` PATCH/POST | Cancel | 🟡 | `{reason: zText(500).optional()}`; participant check ✅. |
| `viewings/[id]/propose` PATCH/POST | Propose new time | 🟡 | `{scheduledAt: z.coerce.date().min(now), message: zText(2000).optional()}` — validate the proposed date is future & sane. |
| `viewings/[id]/approve` | Confirm | ✅ | Slot-conflict added; no body. |

### Reviews
| Route | Purpose | State | Gap → schema |
|---|---|---|---|
| `agents/[id]/reviews` POST | Rate a broker | ✅ | rating 1-5 + 2000-char cap + broker+interaction checks this session. |
| `reviews/[id]` PATCH/DELETE | Edit/delete own review | 🟡 | `{rating: z.number().int().min(1).max(5), comment: zText(2000).nullable()}`; author check ✅. |

### CRM (agent-scoped — withBroker)
| Route | Purpose | State | Gap → schema |
|---|---|---|---|
| `agent/leads` POST, `[id]` PATCH/DELETE | Manage leads | 🟡 | `{clientName:zText(200), clientEmail:zEmail.optional(), clientPhone:zPhone.optional(), propertyId:zId.optional(), interest:zText(500), budget: zMoney.optional(), stage: z.enum(['new','warm','cold'])}`; ownership ✅. `budget` currently `Number()` unbounded. |
| `agent/leads/[id]/chat` POST | Start lead chat | 🟡 | No body fields beyond id; ok. |
| `agent/deals` POST, `[id]` PATCH/DELETE | Manage deals | 🟡 | `{leadId?:zId, title:zText(255), value: zMoney.optional(), commission: zMoney.optional(), stage: z.enum([...]), status: z.enum(['open','won','lost']), notes: zText(5000)}`; ownership ✅. `value/commission` unbounded `Math.round(Number())`. |

### Chats / support
| Route | Purpose | State | Gap → schema |
|---|---|---|---|
| `chats` POST | Start conversation | 🟡 | Validate `{propertyId?:zId, message: zText(5000)}`. |
| `chats/[id]` PATCH | Update conversation | 🟡 | Whitelist patchable fields; participant check ✅. |
| `chats/[id]/messages` POST | Send message | ✅ | type + 5000-char cap + participant authz present. |
| `support/status` POST | Consultant online toggle | 🟡 | `{is_online: z.boolean()}` — currently trusts body. |

### AI (paid, denial-of-wallet sensitive)
| Route | Purpose | State | Gap → schema |
|---|---|---|---|
| `chat` POST | Persistent AI assistant | ✅ | rate-limit + 4000 cap this session. |
| `chat/compare` POST | Compare properties (AI) | ✅ | rate-limit + message/systemContext cap this session. |
| `properties/[id]/chat` POST | Per-property AI chat | ✅ | rate-limit + caps this session. |
| `properties/[id]/opinion` POST | AI opinion | ✅ | rate-limit + cap this session. |
| `search/voice` POST | Voice→search | ✅ | rate-limit + transcript cap this session. |

### Property authoring / tours
| Route | Purpose | State | Gap → schema |
|---|---|---|---|
| `properties/[id]/virtual-tour` POST, `[roomId]` PATCH/DELETE | Author 3D tour rooms | 🟡 | token_version ✅ this session. Validate `{name:{en,ru,hy} zText(120), panorama_url: z.string().url(), hotspots: z.array(hotspotSchema).max(50), order_index: z.number().int()}`; hotspots x/y already clamped 0..1. |
| `upload` POST | Image upload | ✅ | magic-byte sniffing + size/count done. |

### Admin (withAdmin/withModerator — trusted, but still validate input)
| Route | Purpose | State | Gap → schema |
|---|---|---|---|
| `admin/users` POST/PATCH/DELETE | Create/modify/delete users | 🟡 | Actions are enum-checked manually; formalize `action: z.enum([...])`, `role: z.enum(['user','moderator','admin'])`, `user_type: z.enum([...])`, `email:zEmail`. |
| `admin/notifications` POST | Broadcast | 🟡 | `{title: zText(1..200), body: zText(1..2000), target: z.enum(['all','buyer',...])}`. |
| `admin/leads` PATCH/DELETE | Reassign/delete lead | 🟡 | `{lead_id:zId, action:z.enum(['reassign']), agent_id:zId}` — mostly present. |
| `admin/reviews` DELETE, `admin/support` PATCH, `admin/viewings` PATCH | Moderation actions | 🟡 | Validate ids + action enums. |

### Waitlist (anonymous)
| `waitlist` POST | Coming-soon signup | ✅ | rate-limit this session; add `{email:zEmail}` schema. |

---

## Priority order for wiring

1. **Anonymous input first** (auth/*, waitlist, voice) — attacker-reachable without a session.
2. **Money/qty fields** (listings, leads/deals budget/value/commission) — bounds prevent economic abuse.
3. **Free-text stored & shown** (descriptions, messages, reviews, notes) — length caps prevent storage abuse / UI break.
4. **Enums** everywhere (`role`, `user_type`, `deal_type`, `status`, `stage`) — reject off-list values.
5. **`.strict()` objects** — reject unknown keys (mass-assignment defense by default).

## Effort estimate

~40 body routes × (write/reuse schema + 2-line wire + test) ≈ **1–1.5 dev-days**, low risk (additive; each route independently verifiable). Recommend one PR per domain group (auth, users, properties, viewings, crm, chats, admin) so each is reviewable and revertible.

## What's already done (this session, effectively closing the highest-risk subset)
`properties/list` (numeric bounds + text caps), `agents/[id]/reviews` (rating+relationship), `chats/[id]/messages` (type+cap+authz), all 5 AI routes (rate-limit+caps), `upload`+`avatar` (magic-byte), `auth/register` (full zod). The remaining work is breadth/consistency, not an open critical hole.
