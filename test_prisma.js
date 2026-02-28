import dotenv from 'dotenv';
dotenv.config();
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const inv = await prisma.invoice.findFirst();
    console.log('Invoice found:', inv ? inv.id : 'none');
    if (inv) {
      const updated = await prisma.invoice.update({ where: { id: inv.id }, data: { status: 'PAID' } });
      console.log('Updated to:', updated.status);
    }
  } catch (e) {
    console.error('Error:', e.message);
    console.error('Stack:', e.stack);
  } finally {
    await prisma.$disconnect();
  }
}

main();
