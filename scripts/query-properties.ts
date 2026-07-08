import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const properties = await prisma.property.findMany({
      where: {
        available: true,
      },
      take: 10,
      orderBy: {
        listingDate: 'desc',
      },
      select: {
        id: true,
        title: true,
        address: true,
        district: true,
        price: true,
        currency: true,
        rooms: true,
        area: true,
        propertyType: true,
        dealType: true,
        latitude: true,
        longitude: true,
        images: true,
        features: true,
      },
    });

    console.log(JSON.stringify(properties, null, 2));
  } catch (error) {
    console.error('Error querying properties:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
