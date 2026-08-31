const databaseUrl = (process.env.DATABASE_URL ?? '').trim();

if (!databaseUrl) {
  console.error('[render] DATABASE_URL is missing or empty.');
  console.error(
    '[render] Fix: mahbere-lms-api → Environment → add DATABASE_URL from mahbere-lms-db → Connect → Internal Database URL',
  );
  process.exit(1);
}

if (
  !databaseUrl.startsWith('postgresql://') &&
  !databaseUrl.startsWith('postgres://')
) {
  console.error(
    '[render] DATABASE_URL must start with postgresql:// or postgres://',
  );
  console.error(
    `[render] Current value begins with: ${JSON.stringify(databaseUrl.slice(0, 30))}`,
  );
  console.error(
    '[render] You likely pasted only the hostname. Copy the full Internal Database URL.',
  );
  process.exit(1);
}

console.log('[render] DATABASE_URL format OK');
