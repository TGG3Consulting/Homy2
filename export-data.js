const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

async function exportData() {
  const data = {
    users: await prisma.user.findMany(),
    properties: await prisma.property.findMany(),
    favorites: await prisma.favorite.findMany(),
    viewings: await prisma.viewing.findMany(),
    notifications: await prisma.notification.findMany(),
    reviews: await prisma.review.findMany(),
  };

  const outPath = path.join(process.env.TEMP || '.', 'homly-export.json');
  fs.writeFileSync(outPath, JSON.stringify(data, null, 2));
  console.log('Exported to:', outPath);
  console.log('- Users:', data.users.length);
  console.log('- Properties:', data.properties.length);
  console.log('- Favorites:', data.favorites.length);
  console.log('- Viewings:', data.viewings.length);
  console.log('- Notifications:', data.notifications.length);
  console.log('- Reviews:', data.reviews.length);
}
exportData().catch(console.error).finally(() => prisma.$disconnect());
