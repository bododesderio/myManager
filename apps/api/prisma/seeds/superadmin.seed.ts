import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const rawPassword = process.env.SUPERADMIN_PASSWORD || 'superadmin123';
  const password = await bcrypt.hash(rawPassword, 12);

  const user = await prisma.user.upsert({
    where: { email: 'admin@mymanager.app' },
    update: {},
    create: {
      email: 'admin@mymanager.app',
      name: 'Super Admin',
      first_name: 'Super',
      last_name: 'Admin',
      password_hash: password,
      is_superadmin: true,
      email_verified: true,
      status: 'ACTIVE',
    },
  });

  console.log('Superadmin created:', user.email);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
