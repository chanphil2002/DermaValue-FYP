import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
  // Load JSON data
  const usersPath = path.join(__dirname, 'data', 'users.json');
  
  const users = JSON.parse(fs.readFileSync(usersPath, 'utf-8'));

  // Seed clinics
  console.log(`Seeding ${users.length} users...`);
  await prisma.user.createMany({
    data: users,
    skipDuplicates: true,
  });
}

main()
  .catch((e) => {
    console.error('Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });