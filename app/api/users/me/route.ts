// app/api/users/me/route.ts
import { NextResponse } from 'next/server';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';
import prisma from '@/lib/db/prisma';
import bcrypt from 'bcrypt';
import { SELF_ASSIGNABLE_USER_TYPES, isSelfAssignableUserType } from '@/lib/auth/userTypes';

// User data shape returned from API
interface UserResponse {
  id: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  name: string | null;
  first_name: string | null;
  last_name: string | null;
  patronymic: string | null;
  user_type: string | null;
  role: string | null;
  language_preference: string | null;
  notifications_enabled: boolean;
  email_verified: boolean;
  created_at: string;
  search_preferences: {
    preferred_districts: string[];
    budget_min: number | null;
    budget_max: number | null;
    room_count_min: number | null;
    room_count_max: number | null;
  };
}

// GET - Fetch current user data
async function getHandler(req: AuthenticatedRequest) {
  const userId = req.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        first_name: true,
        last_name: true,
        patronymic: true,
        user_type: true,
        role: true,
        language_preference: true,
        notifications_enabled: true,
        search_preferences: true,
        avatar_url: true,
        emailVerified: true,
        createdAt: true,
      }
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Build response with actual values from database
    const searchPrefs = user.search_preferences as Record<string, unknown> | null;
    const response: UserResponse = {
      id: user.id,
      email: user.email,
      phone: user.phone,
      avatar_url: user.avatar_url,
      name: null,
      first_name: user.first_name,
      last_name: user.last_name,
      patronymic: user.patronymic,
      user_type: user.user_type,
      role: user.role,
      language_preference: user.language_preference,
      notifications_enabled: user.notifications_enabled,
      email_verified: user.emailVerified,
      created_at: user.createdAt.toISOString(),
      search_preferences: {
        preferred_districts: (searchPrefs?.preferred_districts as string[]) || [],
        budget_min: (searchPrefs?.budget_min as number) || null,
        budget_max: (searchPrefs?.budget_max as number) || null,
        room_count_min: (searchPrefs?.room_count_min as number) || null,
        room_count_max: (searchPrefs?.room_count_max as number) || null,
      }
    };

    return NextResponse.json({
      success: true,
      user: response
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}

// Validation helpers
function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePhone(phone: string | null | undefined): boolean {
  // Allow null, undefined, empty string, or valid phone formats
  if (phone === null || phone === undefined || phone === '') return true;
  const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,4}[-\s\.]?[0-9]{1,9}$/;
  return phoneRegex.test(phone);
}

function validateUserType(userType: string | null | undefined): boolean {
  if (userType === null || userType === undefined) return true;
  // Only non-privileged personas are self-assignable. 'admin'/'consultant'
  // are granted by admin tooling/seed only — see lib/auth/userTypes.ts.
  return isSelfAssignableUserType(userType);
}

function validateLanguage(lang: string | null | undefined): boolean {
  if (lang === null || lang === undefined) return true;
  const validLangs = ['en', 'ru', 'hy'];
  return validLangs.includes(lang);
}

// PATCH - Update user fields
async function patchHandler(req: AuthenticatedRequest) {
  const userId = req.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const {
      phone,
      first_name,
      last_name,
      patronymic,
      user_type,
      language_preference,
      notifications_enabled,
      search_preferences,
      current_password,
      new_password,
    } = body;

    // Validation errors collection
    const errors: Record<string, string> = {};

    // Build update data
    const updateData: Record<string, unknown> = {};

    // Validate and add phone
    if (phone !== undefined) {
      if (!validatePhone(phone)) {
        errors.phone = 'Invalid phone number format';
      } else {
        updateData.phone = phone;
      }
    }

    // Validate and add first_name (required field - cannot be null or empty)
    if (first_name !== undefined) {
      if (first_name === null || (typeof first_name === 'string' && first_name.trim() === '')) {
        // Skip update if null/empty - keep existing value
      } else {
        updateData.first_name = first_name;
      }
    }

    // Validate and add last_name (required field - cannot be null or empty)
    if (last_name !== undefined) {
      if (last_name === null || (typeof last_name === 'string' && last_name.trim() === '')) {
        // Skip update if null/empty - keep existing value
      } else {
        updateData.last_name = last_name;
      }
    }

    // Add patronymic (no validation needed - can be empty)
    if (patronymic !== undefined) {
      updateData.patronymic = patronymic;
    }

    // Validate and add user_type
    if (user_type !== undefined) {
      if (!validateUserType(user_type)) {
        errors.user_type = `Invalid user type. Must be one of: ${SELF_ASSIGNABLE_USER_TYPES.join(', ')}`;
      } else {
        updateData.user_type = user_type;
      }
    }

    // Validate and add language_preference
    if (language_preference !== undefined) {
      if (!validateLanguage(language_preference)) {
        errors.language_preference = 'Invalid language. Must be one of: en, ru, hy';
      } else {
        updateData.language_preference = language_preference;
      }
    }

    // Handle notifications_enabled
    if (notifications_enabled !== undefined) {
      updateData.notifications_enabled = notifications_enabled;
    }

    // Handle search_preferences
    if (search_preferences !== undefined) {
      updateData.search_preferences = search_preferences;
    }

    // Handle password change
    if (new_password !== undefined) {
      if (!current_password) {
        errors.current_password = 'Current password is required to change password';
      } else {
        // Verify current password
        const user = await prisma.user.findUnique({
          where: { id: userId },
          select: { passwordHash: true }
        });

        if (!user?.passwordHash) {
          errors.current_password = 'No password set for this account';
        } else {
          const isValid = await bcrypt.compare(current_password, user.passwordHash);
          if (!isValid) {
            errors.current_password = 'Current password is incorrect';
          } else if (new_password.length < 8) {
            errors.new_password = 'New password must be at least 8 characters';
          } else if (!/[A-Z]/.test(new_password)) {
            errors.new_password = 'New password must contain at least one uppercase letter';
          } else if (!/[0-9]/.test(new_password)) {
            errors.new_password = 'New password must contain at least one number';
          }
        }
      }
    }

    // Return validation errors if any
    if (Object.keys(errors).length > 0) {
      console.log('[PATCH /api/users/me] Validation errors:', errors);
      console.log('[PATCH /api/users/me] Request body:', body);
      return NextResponse.json(
        { error: 'Validation failed', errors },
        { status: 400 }
      );
    }

    // Hash new password if provided
    let passwordUpdate = {};
    if (new_password && current_password) {
      const hashedPassword = await bcrypt.hash(new_password, 10);
      passwordUpdate = { passwordHash: hashedPassword };
    }

    // Perform update
    console.log('[PATCH /api/users/me] Update data:', updateData);
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        ...updateData,
        ...passwordUpdate,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        first_name: true,
        last_name: true,
        patronymic: true,
        user_type: true,
        role: true,
        language_preference: true,
        notifications_enabled: true,
        search_preferences: true,
        avatar_url: true,
        emailVerified: true,
        createdAt: true,
      }
    });

    // Build response with actual values from database
    const updatedSearchPrefs = updatedUser.search_preferences as Record<string, unknown> | null;
    const response: UserResponse = {
      id: updatedUser.id,
      email: updatedUser.email,
      phone: updatedUser.phone,
      avatar_url: updatedUser.avatar_url,
      name: null,
      first_name: updatedUser.first_name,
      last_name: updatedUser.last_name,
      patronymic: updatedUser.patronymic,
      user_type: updatedUser.user_type,
      role: updatedUser.role,
      language_preference: updatedUser.language_preference,
      notifications_enabled: updatedUser.notifications_enabled,
      email_verified: updatedUser.emailVerified,
      created_at: updatedUser.createdAt.toISOString(),
      search_preferences: {
        preferred_districts: (updatedSearchPrefs?.preferred_districts as string[]) || [],
        budget_min: (updatedSearchPrefs?.budget_min as number) || null,
        budget_max: (updatedSearchPrefs?.budget_max as number) || null,
        room_count_min: (updatedSearchPrefs?.room_count_min as number) || null,
        room_count_max: (updatedSearchPrefs?.room_count_max as number) || null,
      }
    };

    return NextResponse.json({
      success: true,
      message: new_password ? 'Profile and password updated successfully' : 'Profile updated successfully',
      user: response
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Failed to update user data' },
      { status: 500 }
    );
  }
}

// DELETE - Delete user account
async function deleteHandler(req: AuthenticatedRequest) {
  const userId = req.user?.id;
  if (!userId) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { password, confirmation } = body;

    // Require confirmation text
    if (confirmation !== 'DELETE MY ACCOUNT') {
      return NextResponse.json(
        { error: 'Please type "DELETE MY ACCOUNT" to confirm' },
        { status: 400 }
      );
    }

    // Verify password
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { passwordHash: true }
    });

    if (user?.passwordHash) {
      if (!password) {
        return NextResponse.json(
          { error: 'Password is required to delete account' },
          { status: 400 }
        );
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return NextResponse.json(
          { error: 'Incorrect password' },
          { status: 401 }
        );
      }
    }

    // Delete user (cascades to related records due to schema relations)
    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({
      success: true,
      message: 'Account deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Failed to delete account' },
      { status: 500 }
    );
  }
}

export const GET = withAuth(getHandler);
export const PATCH = withAuth(patchHandler);
export const DELETE = withAuth(deleteHandler);
