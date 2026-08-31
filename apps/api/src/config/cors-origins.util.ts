const LOCALHOST_ORIGINS = ['http://localhost:3000', 'http://localhost:3001'];

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, '');
}

/** Build allowed browser origins from CORS_ORIGINS + WEB_PUBLIC_URL. */
export function parseCorsOrigins(
  env: NodeJS.ProcessEnv = process.env,
): string[] {
  const origins = new Set<string>();

  const rawList =
    env.CORS_ORIGINS ??
    (env.NODE_ENV === 'development'
      ? LOCALHOST_ORIGINS.join(',')
      : '');

  for (const part of rawList.split(',')) {
    const normalized = normalizeOrigin(part);
    if (normalized) {
      origins.add(normalized);
    }
  }

  const webPublicUrl = normalizeOrigin(env.WEB_PUBLIC_URL ?? '');
  if (webPublicUrl) {
    origins.add(webPublicUrl);
  }

  if (origins.size === 0 && env.NODE_ENV === 'development') {
    for (const origin of LOCALHOST_ORIGINS) {
      origins.add(origin);
    }
  }

  return [...origins];
}

export function hasProductionWebOrigin(origins: string[]): boolean {
  return origins.some(
    (origin) =>
      origin.startsWith('https://') && !origin.includes('localhost'),
  );
}
