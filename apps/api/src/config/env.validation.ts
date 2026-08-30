function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const WEAK_MINIO_DEFAULTS = new Set(['minioadmin', 'changeme', 'password']);

export function validateEnvironment(): void {
  requireEnv('DATABASE_URL');
  requireEnv('JWT_ACCESS_SECRET');
  requireEnv('JWT_REFRESH_SECRET');

  if ((process.env.JWT_ACCESS_SECRET?.length ?? 0) < 32) {
    throw new Error('JWT_ACCESS_SECRET must be at least 32 characters');
  }

  if ((process.env.JWT_REFRESH_SECRET?.length ?? 0) < 32) {
    throw new Error('JWT_REFRESH_SECRET must be at least 32 characters');
  }

  const nodeEnv = process.env.NODE_ENV ?? 'development';
  if (nodeEnv !== 'development') {
    const driver = process.env.STORAGE_DRIVER;
    if (driver !== 'minio') {
      throw new Error(
        'STORAGE_DRIVER=minio is required when NODE_ENV is not development',
      );
    }

    const accessKey = process.env.MINIO_ACCESS_KEY ?? '';
    const secretKey = process.env.MINIO_SECRET_KEY ?? '';
    if (
      !accessKey ||
      !secretKey ||
      WEAK_MINIO_DEFAULTS.has(accessKey) ||
      WEAK_MINIO_DEFAULTS.has(secretKey)
    ) {
      throw new Error(
        'Non-default MINIO_ACCESS_KEY and MINIO_SECRET_KEY are required outside development',
      );
    }

    requireEnv('MINIO_ENDPOINT');
    requireEnv('MINIO_BUCKET');
  }
}
