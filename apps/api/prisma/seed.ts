import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('admin123', 10);

  const org = await prisma.organization.upsert({
    where: { slug: 'demo' },
    update: {},
    create: { name: 'Demo', slug: 'demo' },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@logisticaqr.com' },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Admin',
      email: 'admin@logisticaqr.com',
      password: hashedPassword,
      role: Role.owner,
    },
  });

  // eslint-disable-next-line no-console
  console.log(`Seed: org "${org.name}" (${org.slug}) — admin ${admin.name} (${admin.email})`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
