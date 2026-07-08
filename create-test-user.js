const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('test', 10);
  const user = await prisma.user.upsert({
    where: { email: 'test@test.com' },
    update: { passwordHash: hash },
    create: {
      email: 'test@test.com',
      passwordHash: hash,
      emailVerified: true,
      user_type: 'buyer'
    }
  });
  console.log('User created:', user.email, user.id);
}
main().catch(e => console.error(e)).finally(() => prisma.$disconnect());
