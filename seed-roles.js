const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const staffPwd = await bcrypt.hash('staff123', 10);
  const accPwd = await bcrypt.hash('acc123', 10);
  const mgrPwd = await bcrypt.hash('mgr123', 10);
  const adminPwd = await bcrypt.hash('admin123', 10);

  await prisma.user.upsert({
    where: { username: 'staffuser' },
    update: {},
    create: { name: 'Staff Member', email: 'staff@example.com', username: 'staffuser', password_hash: staffPwd, role: 'STAFF' }
  });

  await prisma.user.upsert({
    where: { username: 'accuser' },
    update: {},
    create: { name: 'Accountant', email: 'acc@example.com', username: 'accuser', password_hash: accPwd, role: 'ACCOUNTANT' }
  });

  await prisma.user.upsert({
    where: { username: 'mgruser' },
    update: {},
    create: { name: 'Manager', email: 'mgr@example.com', username: 'mgruser', password_hash: mgrPwd, role: 'MANAGER' }
  });

  await prisma.user.upsert({
    where: { username: 'adminuser' },
    update: { password_hash: adminPwd, role: 'ADMIN' },
    create: { name: 'Super Admin', email: 'admin@himalayan.com', username: 'adminuser', password_hash: adminPwd, role: 'ADMIN' }
  });

  console.log('Seed completed for STAFF, ACCOUNTANT, MANAGER, and ADMIN roles.');
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
