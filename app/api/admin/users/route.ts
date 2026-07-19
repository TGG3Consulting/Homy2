import { NextResponse } from 'next/server';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { withAdmin, AdminAuthenticatedRequest, canModerateUser, UserRole } from '@/lib/middleware/adminMiddleware';
import prisma from '@/lib/db/prisma';
import emailService from '@/lib/services/emailService';
import { validateBody, validateQuery } from '@/lib/validations/validate';
import {
  adminUpdateUserSchema,
  adminCreateUserSchema,
  adminDeleteUserQuerySchema,
} from '@/lib/validations/schemas/admin';

const SALT_ROUNDS = 12;
const RESET_TOKEN_EXPIRY_HOURS = 2;

/** Create a password-reset token, revoke sessions optionally handled by caller. Returns the token. */
async function issueResetToken(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);
  await prisma.passwordResetToken.updateMany({ where: { userId, used: false }, data: { used: true } });
  await prisma.passwordResetToken.create({ data: { userId, token, expiresAt } });
  return token;
}

// GET - List users with pagination and filtering
async function getUsers(req: AdminAuthenticatedRequest) {
  const { searchParams } = new URL(req.url);

  const page = parseInt(searchParams.get('page') || '1');
  const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
  const search = searchParams.get('search') || '';
  const role = searchParams.get('role');
  const userType = searchParams.get('user_type');
  const isBlocked = searchParams.get('is_blocked');
  const sortBy = searchParams.get('sort_by') || 'createdAt';
  const sortOrder = (searchParams.get('sort_order') || 'desc') as 'asc' | 'desc';

  try {
    // Build where clause
    const where: Record<string, unknown> = {};

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (userType) {
      where.user_type = userType;
    }

    if (isBlocked !== null && isBlocked !== undefined && isBlocked !== '') {
      where.is_blocked = isBlocked === 'true';
    }

    // Execute queries in parallel
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          first_name: true,
          last_name: true,
          phone: true,
          user_type: true,
          role: true,
          is_blocked: true,
          blocked_at: true,
          block_reason: true,
          emailVerified: true,
          createdAt: true,
          updatedAt: true,
          _count: {
            select: {
              favorites: true,
              viewingsAsClient: true,
              property_listings: true,
            }
          }
        },
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          total_pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    );
  }
}

// PATCH - Block/Unblock user or change role
async function updateUser(req: AdminAuthenticatedRequest) {
  try {
    // Schema validation (VULN-022): shape/enums/bounds only; role rules below.
    const validation = validateBody(adminUpdateUserSchema, await req.json());
    if (!validation.success) return validation.error;
    const body = validation.data;
    const { user_id, action } = body;
    const reason = 'reason' in body ? body.reason : undefined;
    const new_role = 'new_role' in body ? body.new_role : undefined;

    const targetUser = await prisma.user.findUnique({
      where: { id: user_id },
      select: { id: true, role: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if admin can moderate this user
    const actorRole = req.user?.role as UserRole;
    const targetRole = (targetUser.role || 'user') as UserRole;

    if (!canModerateUser(actorRole, targetRole)) {
      return NextResponse.json(
        { error: 'Cannot moderate this user' },
        { status: 403 }
      );
    }

    // Force password reset + logout everywhere: bump token_version (revokes all
    // sessions instantly) and issue a reset token. We never set a password here;
    // the user sets their own via the reset link (emailed; also returned so the
    // admin can hand it over if SMTP isn't configured).
    if (action === 'force_reset') {
      const adminId0 = req.user?.id;
      // Invalidate the OLD password (random unusable hash) AND revoke all sessions
      // (token_version bump). The user regains access only via the reset link below.
      const deadHash = await bcrypt.hash(crypto.randomBytes(24).toString('hex'), SALT_ROUNDS);
      await prisma.$transaction([
        prisma.user.update({ where: { id: user_id }, data: { passwordHash: deadHash, token_version: { increment: 1 } } }),
        prisma.adminActionLog.create({
          data: { admin_id: adminId0!, action_type: 'user_force_reset', target_type: 'user', target_id: user_id, details: {} },
        }),
      ]);
      const token = await issueResetToken(user_id);
      let emailed = false;
      try { emailed = await emailService.sendPasswordResetEmail(targetUser.email, token); } catch { emailed = false; }
      return NextResponse.json({
        success: true,
        message: 'Пароль сброшен, все сессии завершены',
        emailed,
        reset_url: `/reset-password?token=${token}`,
      });
    }

    const adminId = req.user?.id;
    let actionType: string;
    let updateData: Record<string, unknown> = {};

    switch (body.action) {
      case 'block':
        updateData = {
          is_blocked: true,
          blocked_at: new Date(),
          blocked_by: adminId,
          block_reason: reason || 'No reason provided',
        };
        actionType = 'user_block';
        break;

      case 'unblock':
        updateData = {
          is_blocked: false,
          blocked_at: null,
          blocked_by: null,
          block_reason: null,
        };
        actionType = 'user_unblock';
        break;

      case 'change_role':
        // new_role shape/enum is enforced by the schema.
        // Only admins can promote to admin
        if (body.new_role === 'admin' && actorRole !== 'admin') {
          return NextResponse.json(
            { error: 'Only admins can promote to admin role' },
            { status: 403 }
          );
        }
        updateData = { role: body.new_role };
        actionType = 'role_change';
        break;

      case 'update_profile': {
        // Edit basic profile fields (name/phone) through the panel.
        const data: Record<string, unknown> = {};
        if (typeof body.first_name === 'string') data.first_name = body.first_name.trim();
        if (typeof body.last_name === 'string') data.last_name = body.last_name.trim();
        if (typeof body.phone === 'string') data.phone = body.phone.trim() || null;
        if (Object.keys(data).length === 0) {
          return NextResponse.json({ error: 'Нет полей для обновления' }, { status: 400 });
        }
        updateData = data;
        actionType = 'user_profile_update';
        break;
      }

      case 'verify_email': {
        // Manually confirm a user's email from the panel.
        updateData = { emailVerified: true };
        actionType = 'user_verify_email';
        break;
      }

      case 'set_user_type': {
        // Product persona (buyer/renter/owner/agent/consultant) — set through the
        // admin panel instead of hand-editing the DB/API (closes the C1 workaround,
        // e.g. provisioning a consultant). Enum is enforced by the schema.
        updateData = { user_type: body.user_type };
        actionType = 'user_type_change';
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: block, unblock, change_role, set_user_type, update_profile, or verify_email' },
          { status: 400 }
        );
    }

    // Update user and log action
    const [updatedUser] = await Promise.all([
      prisma.user.update({
        where: { id: user_id },
        data: updateData,
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          phone: true,
          emailVerified: true,
          role: true,
          user_type: true,
          is_blocked: true,
          blocked_at: true,
          block_reason: true,
        },
      }),
      prisma.adminActionLog.create({
        data: {
          admin_id: adminId!,
          action_type: actionType,
          target_type: 'user',
          target_id: user_id,
          details: { reason, new_role, previous_role: targetRole, user_type: 'user_type' in body ? body.user_type : undefined },
        },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `User ${action}${action === 'change_role' ? 'd to ' + new_role : 'ed'} successfully`,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    );
  }
}

// POST - Create a user (admin). No password is set here; the user sets their own
// via the reset link (emailed; also returned so the admin can hand it over).
async function createUser(req: AdminAuthenticatedRequest) {
  try {
    // Schema validation (VULN-022): email format/lowercase + enums + bounds.
    const validation = validateBody(adminCreateUserSchema, await req.json());
    if (!validation.success) return validation.error;
    const body = validation.data;
    const email = body.email; // already lowercased/validated by emailSchema

    const exists = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (exists) return NextResponse.json({ error: 'Пользователь с таким email уже существует' }, { status: 409 });

    const uType = body.user_type ?? 'buyer';
    const uRole = body.role ?? 'user';

    // Unusable random password — the account is only accessible after the user
    // sets their own password through the reset link.
    const randomPw = crypto.randomBytes(24).toString('hex');
    const passwordHash = await bcrypt.hash(randomPw, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        // first_name/last_name are non-nullable columns; empty string when omitted
        // (the old `|| null` was a latent Prisma runtime error surfaced by typing).
        first_name: (body.first_name || '').trim(),
        last_name: (body.last_name || '').trim(),
        phone: (body.phone || '').trim() || null,
        user_type: uType,
        role: uRole,
        emailVerified: true, // admin-provisioned accounts are pre-verified
      },
      select: { id: true, email: true, user_type: true, role: true },
    });

    const token = await issueResetToken(user.id);
    let emailed = false;
    try { emailed = await emailService.sendPasswordResetEmail(email, token); } catch { emailed = false; }

    await prisma.adminActionLog.create({
      data: { admin_id: req.user!.id, action_type: 'user_create', target_type: 'user', target_id: user.id, details: { email, user_type: uType, role: uRole } },
    });

    return NextResponse.json({ success: true, user, emailed, set_password_url: `/reset-password?token=${token}` });
  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json({ error: 'Не удалось создать пользователя' }, { status: 500 });
  }
}

// DELETE - Hard-delete a regular user and their content (irreversible).
// Restricted to role='user' (staff accounts keep audit logs → block/demote instead).
async function deleteUser(req: AdminAuthenticatedRequest) {
  try {
    // Schema validation (VULN-022): user_id must be a UUID (query param).
    const validation = validateQuery(adminDeleteUserQuerySchema, new URL(req.url).searchParams);
    if (!validation.success) return validation.error;
    const { user_id } = validation.data;
    if (user_id === req.user?.id) return NextResponse.json({ error: 'Нельзя удалить собственный аккаунт' }, { status: 400 });

    const target = await prisma.user.findUnique({ where: { id: user_id }, select: { id: true, role: true, email: true } });
    if (!target) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (target.role === 'admin' || target.role === 'moderator') {
      return NextResponse.json({ error: 'Нельзя стереть админа/модератора. Снимите роль или заблокируйте.' }, { status: 403 });
    }

    await prisma.adminActionLog.create({
      data: { admin_id: req.user!.id, action_type: 'user_delete', target_type: 'user', target_id: user_id, details: { email: target.email } },
    });

    // Clean up Restrict-referencing rows first, then cascade the rest via the delete.
    await prisma.$transaction([
      prisma.viewing.deleteMany({ where: { OR: [{ clientId: user_id }, { agentId: user_id }, { createdById: user_id }, { lastProposedById: user_id }] } }),
      prisma.propertyListing.deleteMany({ where: { owner_id: user_id } }),
      prisma.property.deleteMany({ where: { owner_id: user_id } }), // cascades favorites/viewings/tours/chats
      prisma.user.delete({ where: { id: user_id } }),               // cascades reviews/leads/deals/notifications/etc.
    ]);

    return NextResponse.json({ success: true, message: 'Пользователь и его данные удалены' });
  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json({ error: 'Не удалось удалить пользователя' }, { status: 500 });
  }
}

export const GET = withAdmin(getUsers);
export const POST = withAdmin(createUser);
export const PATCH = withAdmin(updateUser);
export const DELETE = withAdmin(deleteUser);
