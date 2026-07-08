import prisma from '../db/prisma';
import type { ViewingSlot } from '@prisma/client';

// Time slots available for viewings (matching frontend expectations)
const TIME_SLOTS = [
  '10:00', '11:00', '12:00',
  '14:00', '15:00', '16:00', '17:00', '18:00', '18:30'
];

// Days of week: 0 = Sunday, 6 = Saturday
// Working days are Monday (1) through Saturday (6)
const isWorkingDay = (date: Date): boolean => {
  const day = date.getDay();
  return day >= 1 && day <= 6; // Mon-Sat
};

// Check if a date is in the past (before today)
const isPastDate = (date: Date): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);
  return checkDate < today;
};

export const viewingSlotService = {
  /**
   * Get available (not booked) slots for a property within a date range
   */
  async getAvailableSlots(
    propertyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ViewingSlot[]> {
    return prisma.viewingSlot.findMany({
      where: {
        property_id: propertyId,
        available: true,
        booked_by: null,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' },
      ],
    });
  },

  /**
   * Get all slots (available and booked) for a property within a date range
   */
  async getAllSlots(
    propertyId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ViewingSlot[]> {
    return prisma.viewingSlot.findMany({
      where: {
        property_id: propertyId,
        date: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' },
      ],
      include: {
        user: {
          select: {
            id: true,
            email: true,
            phone: true,
          },
        },
      },
    });
  },

  /**
   * Book a viewing slot for a user
   */
  async bookSlot(slotId: string, userId: string): Promise<ViewingSlot> {
    // First check if slot exists and is available
    const slot = await prisma.viewingSlot.findUnique({
      where: { id: slotId },
    });

    if (!slot) {
      throw new Error('Viewing slot not found');
    }

    if (!slot.available || slot.booked_by !== null) {
      throw new Error('This viewing slot is no longer available');
    }

    // Check if the slot date is in the past
    if (isPastDate(slot.date)) {
      throw new Error('Cannot book a slot in the past');
    }

    // Book the slot
    return prisma.viewingSlot.update({
      where: { id: slotId },
      data: {
        booked_by: userId,
        available: false,
      },
    });
  },

  /**
   * Cancel a booking - only the user who booked can cancel
   */
  async cancelBooking(slotId: string, userId: string): Promise<ViewingSlot> {
    const slot = await prisma.viewingSlot.findUnique({
      where: { id: slotId },
    });

    if (!slot) {
      throw new Error('Viewing slot not found');
    }

    if (slot.booked_by !== userId) {
      throw new Error('You can only cancel your own bookings');
    }

    // Cancel the booking and make slot available again
    return prisma.viewingSlot.update({
      where: { id: slotId },
      data: {
        booked_by: null,
        available: true,
      },
    });
  },

  /**
   * Generate viewing slots for a property for the next N days
   * - Only generates slots for working days (Mon-Sat)
   * - Skips Sundays
   * - Skips past dates
   * - Does not create duplicates for existing slots
   */
  async generateSlots(propertyId: string, days: number = 14): Promise<ViewingSlot[]> {
    const createdSlots: ViewingSlot[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get existing slots for this property to avoid duplicates
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days);

    const existingSlots = await prisma.viewingSlot.findMany({
      where: {
        property_id: propertyId,
        date: {
          gte: today,
          lte: endDate,
        },
      },
      select: {
        date: true,
        time: true,
      },
    });

    // Create a set of existing slot keys for quick lookup
    const existingSlotKeys = new Set(
      existingSlots.map(slot => {
        const dateStr = slot.date.toISOString().split('T')[0];
        return `${dateStr}_${slot.time}`;
      })
    );

    // Generate slots for each day
    for (let i = 0; i < days; i++) {
      const slotDate = new Date(today);
      slotDate.setDate(slotDate.getDate() + i);

      // Skip non-working days (Sundays)
      if (!isWorkingDay(slotDate)) {
        continue;
      }

      // Create slots for each time slot
      for (const time of TIME_SLOTS) {
        const dateStr = slotDate.toISOString().split('T')[0];
        const slotKey = `${dateStr}_${time}`;

        // Skip if slot already exists
        if (existingSlotKeys.has(slotKey)) {
          continue;
        }

        const slot = await prisma.viewingSlot.create({
          data: {
            property_id: propertyId,
            date: slotDate,
            time: time,
            available: true,
          },
        });

        createdSlots.push(slot);
      }
    }

    return createdSlots;
  },

  /**
   * Get slots for a specific user (their bookings)
   */
  async getUserBookings(userId: string): Promise<ViewingSlot[]> {
    return prisma.viewingSlot.findMany({
      where: {
        booked_by: userId,
      },
      orderBy: [
        { date: 'asc' },
        { time: 'asc' },
      ],
      include: {
        property: {
          select: {
            id: true,
            title: true,
            address: true,
          },
        },
      },
    });
  },

  /**
   * Delete all slots for a property (useful when property is deleted)
   */
  async deletePropertySlots(propertyId: string): Promise<{ count: number }> {
    return prisma.viewingSlot.deleteMany({
      where: {
        property_id: propertyId,
      },
    });
  },

  /**
   * Check if a slot is available
   */
  async isSlotAvailable(slotId: string): Promise<boolean> {
    const slot = await prisma.viewingSlot.findUnique({
      where: { id: slotId },
      select: {
        available: true,
        booked_by: true,
        date: true,
      },
    });

    if (!slot) {
      return false;
    }

    return slot.available && slot.booked_by === null && !isPastDate(slot.date);
  },
};

export default viewingSlotService;
