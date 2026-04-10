import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === 'production') {
    console.log('Skipping seed in production environment.');
    return;
  }

  const email = 'admin@admin.com';
  const existing = await prisma.user.findUnique({ where: { email } });

  if (existing) {
    console.log(`Admin user already exists: ${email}`);
    return;
  }

  const passwordHash = await bcrypt.hash('admin', 12);

  await prisma.user.create({
    data: {
      email,
      passwordHash,
      name: 'Admin',
      role: UserRole.ADMIN,
      isVerified: true,
    },
  });

  console.log(`Created dev admin user: ${email} / admin`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
