import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db/prisma';
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/authMiddleware';

export const POST = withAuth(async (req: AuthenticatedRequest) => {
  try {
    const { property_id, message, contact_method } = await req.json();

    if (!property_id) {
      return NextResponse.json(
        { error: 'Property ID is required' },
        { status: 400 }
      );
    }

    // Check if property exists and get contact info
    const property = await prisma.property.findUnique({
      where: { id: property_id },
      select: { id: true, title: true, contact: true },
    });

    if (!property) {
      return NextResponse.json(
        { error: 'Property not found' },
        { status: 404 }
      );
    }

    // Log contact request (could be expanded to a separate table)
    console.log('Contact request:', {
      userId: req.user!.id,
      propertyId: property_id,
      method: contact_method || 'email',
      message,
      timestamp: new Date(),
    });

    // In a real app, you'd send notification to the agent here
    // await notificationService.notifyAgent(property.contact, message);

    return NextResponse.json({
      success: true,
      message: 'Contact request sent',
      contact: property.contact,
    });
  } catch (error) {
    console.error('Agent contact error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});
