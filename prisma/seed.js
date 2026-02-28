import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const existingAdmin = await prisma.user.findUnique({
    where: { email: 'admin@himalayan.com' }
  });

  if (!existingAdmin) {
    const password_hash = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.create({
      data: {
        name: 'Super Admin',
        email: 'admin@himalayan.com',
        password_hash,
        role: 'ADMIN',
      }
    });
    console.log('Seed: Default admin created (admin@himalayan.com / admin123)');
  } else {
    console.log('Seed: Admin already exists');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
