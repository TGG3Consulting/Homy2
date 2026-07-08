import { NextRequest, NextResponse } from 'next/server';
import { withOptionalAuth, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

// Default consultant (as shown in frontend)
const DEFAULT_CONSULTANT = {
  id: 'default-consultant',
  name: 'Anna Hakobyan',
  role: 'Personal consultant',
  avatar: '/images/consultant-avatar.jpg',
  verified: true,
  languages: ['English', 'Russian', 'Armenian'],
  specialization: 'Residential properties in Yerevan',
  contact_available: true,
};

export const GET = withOptionalAuth(async (req: AuthenticatedRequest) => {
  try {
    // In a real app, you'd look up assigned consultant based on user
    // const assignedConsultant = await prisma.userConsultant.findFirst({
    //   where: { userId: req.user?.id },
    //   include: { consultant: true },
    // });

    // For now, return default consultant
    return NextResponse.json({
      consultant: DEFAULT_CONSULTANT,
    });
  } catch (error) {
    console.error('Get consultant error:', error);
    return NextResponse.json({
      consultant: DEFAULT_CONSULTANT,
    });
  }
});
