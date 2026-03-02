const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial Multi-Tenant Data...');

  // 1. Create a Test Tenant (Business)
  const tenant = await prisma.tenant.create({
    data: {
      company_name: 'Himalayan Building Materials',
      domain: 'himalayan.local',
      subscription: 'ACTIVE',
    },
  });
  console.log(`✅ Created Tenant: ${tenant.company_name} (ID: ${tenant.id})`);

  // 2. Create the Tenant Owner (Admin User)
  const password_hash = await bcrypt.hash('password123', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@himalayan.local' },
    update: {},
    create: {
      tenant_id: tenant.id,
      name: 'Faizan (Owner)',
      username: 'faizan',
      email: 'admin@himalayan.local',
      password_hash: password_hash,
      role: 'ADMIN',
    },
  });
  
  console.log(`✅ Created Tenant Admin: ${admin.email}`);

  // 3. Create a Second Tenant to prove isolation
  const tenant2 = await prisma.tenant.create({
    data: {
      company_name: 'Global Traders Inc',
      domain: 'global.local',
      subscription: 'TRIAL',
    },
  });

  const admin2 = await prisma.user.upsert({
    where: { email: 'owner@global.local' },
    update: {},
    create: {
      tenant_id: tenant2.id,
      name: 'Global Owner',
      username: 'global_admin',
      email: 'owner@global.local',
      password_hash: password_hash,
      role: 'ADMIN',
    },
  });
  console.log(`✅ Created Second Tenant: ${tenant2.company_name} & Admin: ${admin2.email}`);

  console.log('\nSeed successful! You can now log in with:');
  console.log('1. admin@himalayan.local / password123');
  console.log('2. owner@global.local / password123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
