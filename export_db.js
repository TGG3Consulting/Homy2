const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  const data = {
    users: await prisma.user.findMany(),
    properties: await prisma.property.findMany(),
    favorites: await prisma.favorite.findMany(),
    viewings: await prisma.viewing.findMany(),
    reviews: await prisma.review.findMany(),
    notifications: await prisma.notification.findMany(),
  };
  
  fs.writeFileSync('homly_data.json', JSON.stringify(data, null, 2));
  console.log('Exported:', Object.keys(data).map(k => k + ':' + data[k].length).join(', '));
  await prisma.$disconnect();
}
main();
