const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const defaults = ["PVC", "CEMENT", "IRON", "WOOD"];
  for (const name of defaults) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }
  console.log("Seeded default categories.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
