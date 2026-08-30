const { createHash } = require('crypto');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const prisma = new PrismaClient();
  const base = 'http://localhost:4000/api/v1';
  const email = 'student@mahbereahaw.org';
  const password =
    process.env.SEED_STUDENT_PASSWORD || 'Student@mahbereahaw';

  const forgot = await fetch(`${base}/auth/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-request-id': 'smoke-reset-1',
    },
    body: JSON.stringify({ email }),
  });
  console.log('forgot', forgot.status, 'reqId=', forgot.headers.get('x-request-id'));
  console.log('forgot body', (await forgot.json()).data);

  const user = await prisma.user.findFirst({ where: { email } });
  if (!user) throw new Error('student user missing');

  const raw = 'a'.repeat(64);
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, usedAt: null },
    data: { usedAt: new Date() },
  });
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      tokenHash: createHash('sha256').update(raw).digest('hex'),
      expiresAt: new Date(Date.now() + 3_600_000),
    },
  });

  const reset = await fetch(`${base}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: raw, newPassword: password }),
  });
  console.log('reset', reset.status, await reset.json());

  const login = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  console.log('login', login.status);

  await prisma.$disconnect();

  if (
    ![200, 201].includes(forgot.status) ||
    ![200, 201].includes(reset.status) ||
    ![200, 201].includes(login.status)
  ) {
    process.exit(1);
  }
  console.log('PASSWORD RESET E2E PASSED');
}

main().catch(async (error) => {
  console.error(error);
  process.exit(1);
});
