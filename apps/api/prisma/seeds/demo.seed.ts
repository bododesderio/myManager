import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('demo1234', 12);

  const proPlan = await prisma.plan.findFirst({ where: { slug: 'pro' } });
  if (!proPlan) throw new Error('Pro plan not found — run plans.seed.ts first');

  const user = await prisma.user.upsert({
    where: { email: 'demo@mymanager.app' },
    update: {},
    create: {
      email: 'demo@mymanager.app',
      name: 'Demo User',
      password_hash: password,
      is_superadmin: false,
      email_verified: true,
    },
  });

  const workspace = await prisma.workspace.upsert({
    where: { slug: 'demo-workspace' },
    update: {},
    create: {
      name: 'Demo Workspace',
      slug: 'demo-workspace',
    },
  });

  await prisma.workspaceMember.upsert({
    where: {
      user_id_workspace_id: {
        user_id: user.id,
        workspace_id: workspace.id,
      },
    },
    update: {},
    create: {
      user_id: user.id,
      workspace_id: workspace.id,
      role: 'OWNER',
    },
  });

  const now = new Date();
  const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const existingSub = await prisma.subscription.findFirst({
    where: { user_id: user.id, workspace_id: workspace.id },
  });

  if (!existingSub) {
    await prisma.subscription.create({
      data: {
        user_id: user.id,
        workspace_id: workspace.id,
        plan_id: proPlan.id,
        status: 'ACTIVE',
        billing_cycle: 'MONTHLY',
        billing_currency: 'USD',
        billing_amount: 19,
        current_period_start: now,
        current_period_end: thirtyDaysLater,
        locked_limits: proPlan.limits as any,
        locked_features: proPlan.features as any,
      },
    });
  }

  console.log('Demo user created:', user.email);
  console.log('Demo workspace created:', workspace.name);
  console.log('Subscription created: Pro plan (active)');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
