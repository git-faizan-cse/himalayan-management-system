const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2];
  
  if (!email) {
    console.log('Usage: node make-super-admin.js <user_email>');
    console.log('Example: node make-super-admin.js admin@himalayan.local');
    process.exit(1);
  }

  try {
    const user = await prisma.user.update({
      where: { email },
      data: { role: 'SUPER_ADMIN' }
    });
    console.log(`✅ Success! User ${user.email} is now a SUPER_ADMIN.`);
  } catch (error) {
    if (error.code === 'P2025') {
      console.log(`❌ Error: User with email "${email}" not found.`);
    } else {
      console.error('❌ Unexpected Error:', error.message);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main();
