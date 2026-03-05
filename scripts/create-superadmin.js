const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    const username = 'superadmin';
    const email = 'superadmin@dealerdesk.com';
    const rawPassword = 'DealerDeskAdmin2026!'; // Change this if you want

    console.log('Checking if Master Tenant exists...');
    
    // 1. We need a "Master Tenant" to hold the Super Admin (since Users belong to Tenants)
    let masterTenant = await prisma.tenant.findFirst({
      where: { company_name: 'Dealer Desk System' }
    });

    if (!masterTenant) {
      console.log('Creating Master Tenant...');
      masterTenant = await prisma.tenant.create({
        data: {
          company_name: 'Dealer Desk System',
          subscription: 'ACTIVE'
        }
      });
    }

    // 2. Check if Super Admin already exists
    const existingAdmin = await prisma.user.findFirst({
      where: { email }
    });

    if (existingAdmin) {
      console.log(`Super Admin already exists with email: ${email}`);
      return;
    }

    // 3. Create Super Admin user
    const passwordHash = await bcrypt.hash(rawPassword, 10);
    
    console.log('Creating Super Admin user...');
    const superAdmin = await prisma.user.create({
      data: {
        tenant_id: masterTenant.id,
        name: 'System Administrator',
        username: username,
        email: email,
        password_hash: passwordHash,
        role: 'SUPER_ADMIN'
      }
    });

    console.log('\n✅ Super Admin created successfully!');
    console.log('--------------------------------------------------');
    console.log(`Login URL: /login`);
    console.log(`Username / Email: ${email}`);
    console.log(`Password: ${rawPassword}`);
    console.log('--------------------------------------------------');
  } catch (error) {
    console.error('Error creating super admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
