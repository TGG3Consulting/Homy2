import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function getAllProperties() {
  try {
    const properties = await prisma.property.findMany({
      where: {
        available: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    console.log(JSON.stringify(properties, null, 2));
  } catch (error) {
    console.error('Error fetching properties:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getAllProperties();
