import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Create workspace 1
  const workspace1 = await prisma.workspace.create({
    data: {
      name: 'Acme Corp',
      slug: 'acme-corp',
      description: 'The main workspace for Acme Corporation.',
    },
  });

  // Create workspace 2
  const workspace2 = await prisma.workspace.create({
    data: {
      name: 'Globex',
      slug: 'globex',
      description: 'Global Export Corporation.',
    },
  });

  console.log(`Created workspaces: ${workspace1.name}, ${workspace2.name}`);
  console.log('Seed finished successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
