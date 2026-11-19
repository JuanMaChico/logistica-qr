import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const isProduction = process.env.NODE_ENV === 'production';

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@logisticaqr.com';
  const orgName = process.env.SEED_ORG_NAME ?? 'Demo';
  const orgSlug = process.env.SEED_ORG_SLUG ?? 'demo';
  // En producción el password del owner DEBE venir por env: nunca sembrar la
  // credencial de demo conocida (admin123). En dev se permite para DX local.
  const password = process.env.SEED_ADMIN_PASSWORD ?? (isProduction ? undefined : 'admin123');

  if (!password) {
    throw new Error(
      'Seed en producción: definí SEED_ADMIN_PASSWORD (y preferentemente SEED_ADMIN_EMAIL) para crear el owner.',
    );
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const org = await prisma.organization.upsert({
    where: { slug: orgSlug },
    update: {},
    create: { name: orgName, slug: orgSlug },
  });

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      organizationId: org.id,
      name: 'Admin',
      email,
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
