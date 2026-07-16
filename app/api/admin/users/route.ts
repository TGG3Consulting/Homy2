import { NextResponse } from 'next/server';
import { withAdmin, AdminAuthenticatedRequest, canModerateUser, UserRole } from '@/lib/middleware/adminMiddleware';
import prisma from '@/lib/db/prisma';

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
    const body = await req.json();
    const { user_id, action, reason, new_role } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id is required' },
        { status: 400 }
      );
    }

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

    const adminId = req.user?.id;
    let actionType: string;
    let updateData: Record<string, unknown> = {};

    switch (action) {
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
        if (!new_role || !['user', 'moderator', 'admin'].includes(new_role)) {
          return NextResponse.json(
            { error: 'Invalid role' },
            { status: 400 }
          );
        }
        // Only admins can promote to admin
        if (new_role === 'admin' && actorRole !== 'admin') {
          return NextResponse.json(
            { error: 'Only admins can promote to admin role' },
            { status: 403 }
          );
        }
        updateData = { role: new_role };
        actionType = 'role_change';
        break;

      case 'set_user_type': {
        // Product persona (buyer/renter/owner/agent/consultant) — set through the
        // admin panel instead of hand-editing the DB/API (closes the C1 workaround,
        // e.g. provisioning a consultant).
        const ALLOWED_USER_TYPES = ['buyer', 'renter', 'owner', 'agent', 'consultant'];
        const nextType = body.user_type;
        if (!nextType || !ALLOWED_USER_TYPES.includes(nextType)) {
          return NextResponse.json(
            { error: `Invalid user_type. Use one of: ${ALLOWED_USER_TYPES.join(', ')}` },
            { status: 400 }
          );
        }
        updateData = { user_type: nextType };
        actionType = 'user_type_change';
        break;
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Use: block, unblock, change_role, or set_user_type' },
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
          details: { reason, new_role, previous_role: targetRole, user_type: body.user_type },
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

export const GET = withAdmin(getUsers);
export const PATCH = withAdmin(updateUser);
