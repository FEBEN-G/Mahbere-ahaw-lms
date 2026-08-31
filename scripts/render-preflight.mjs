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

const nodeEnv = process.env.NODE_ENV ?? 'development';
const storageDriver = process.env.STORAGE_DRIVER ?? 'local';

if (nodeEnv !== 'development') {
  const webPublicUrl = (process.env.WEB_PUBLIC_URL ?? '').trim();
  if (!webPublicUrl) {
    console.error('[render] WEB_PUBLIC_URL is missing.');
    console.error(
      '[render] Fix: set WEB_PUBLIC_URL=https://mahbere-ahaw-lms-web.onrender.com on the API service',
    );
    process.exit(1);
  }

  const corsOrigins = [
    ...new Set(
      [
        ...(process.env.CORS_ORIGINS ?? '')
          .split(',')
          .map((origin) => origin.trim().replace(/\/+$/, ''))
          .filter(Boolean),
        webPublicUrl.replace(/\/+$/, ''),
      ].filter(Boolean),
    ),
  ];

  console.log('[render] CORS origins:', corsOrigins.join(', '));
}

if (nodeEnv !== 'development' && storageDriver === 'local') {
  const localPath = (process.env.STORAGE_LOCAL_PATH ?? '').trim();

  if (!localPath) {
    console.error(
      '[render] STORAGE_LOCAL_PATH is required when STORAGE_DRIVER=local',
    );
    process.exit(1);
  }

  if (!localPath.startsWith('/')) {
    console.error(
      '[render] STORAGE_LOCAL_PATH must be absolute (e.g. /data/uploads)',
    );
    process.exit(1);
  }

  const fs = await import('node:fs');
  const path = await import('node:path');

  try {
    if (!fs.existsSync(localPath)) {
      fs.mkdirSync(localPath, { recursive: true });
    }
    const testFile = path.join(localPath, '.render-write-test');
    fs.writeFileSync(testFile, 'ok');
    fs.unlinkSync(testFile);
    console.log('[render] STORAGE_LOCAL_PATH writable:', localPath);
  } catch (err) {
    console.error('[render] Cannot write to STORAGE_LOCAL_PATH:', localPath);
    console.error(`[render] ${err instanceof Error ? err.message : err}`);
    console.error(
      '[render] Fix: mahbere-lms-api → Disks → add Persistent Disk, mount path exactly:',
      localPath,
    );
    console.error(
      '[render] Then redeploy. Mount path and STORAGE_LOCAL_PATH must match.',
    );
    console.error(
      '[render] Temporary boot only (files lost on redeploy): STORAGE_LOCAL_PATH=/opt/render/project/src/storage/uploads',
    );
    process.exit(1);
  }
}
