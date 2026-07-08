import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function queryProperties() {
  try {
    const count = await prisma.property.count();
    console.log('Total properties:', count);

    const properties = await prisma.property.findMany({
      select: {
        id: true,
        title: true,
        address: true,
        price: true,
        currency: true,
        area: true,
        rooms: true,
        bedrooms: true,
        bathrooms: true,
        district: true,
        latitude: true,
        longitude: true,
        propertyType: true,
        dealType: true,
        images: true,
        features: true,
        condition: true,
        floor: true,
        totalFloors: true
      },
      orderBy: [
        { district: 'asc' },
        { price: 'asc' }
      ]
    });

    console.log(JSON.stringify(properties, null, 2));
  } catch (error: any) {
    console.error('Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

queryProperties();
