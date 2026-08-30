export default function configuration() {
  return {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    api: {
      port: Number(process.env.API_PORT ?? 4000),
      prefix: process.env.API_PREFIX ?? 'api/v1',
      corsOrigins: (
        process.env.CORS_ORIGINS ??
        'http://localhost:3000,http://localhost:3001'
      )
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean),
    },
    database: {
      url: process.env.DATABASE_URL,
    },
    redis: {
      url: process.env.REDIS_URL ?? 'redis://localhost:6379',
    },
    jwt: {
      accessSecret: process.env.JWT_ACCESS_SECRET,
      refreshSecret: process.env.JWT_REFRESH_SECRET,
      accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN ?? '15m',
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
    },
    storage: {
      driver: process.env.STORAGE_DRIVER ?? 'local',
      localPath: process.env.STORAGE_LOCAL_PATH ?? '../../storage/uploads',
      minio: {
        endpoint: process.env.MINIO_ENDPOINT ?? 'localhost',
        port: Number(process.env.MINIO_PORT ?? 9000),
        accessKey: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
        secretKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
        bucket: process.env.MINIO_BUCKET ?? 'lms-content',
        useSSL: process.env.MINIO_USE_SSL === 'true',
      },
    },
    smtp: {
      host: process.env.SMTP_HOST ?? 'localhost',
      port: Number(process.env.SMTP_PORT ?? 1025),
      secure: process.env.SMTP_SECURE === 'true',
      user: process.env.SMTP_USER ?? '',
      pass: process.env.SMTP_PASS ?? '',
      from: process.env.SMTP_FROM ?? 'Mahbere Ahaw LMS <noreply@mahbereahaw.org>',
    },
    vapid: {
      publicKey: process.env.VAPID_PUBLIC_KEY ?? '',
      privateKey: process.env.VAPID_PRIVATE_KEY ?? '',
      subject: process.env.VAPID_SUBJECT ?? 'mailto:admin@mahbereahaw.org',
    },
    web: {
      publicUrl: process.env.WEB_PUBLIC_URL ?? 'http://localhost:3000',
    },
  };
}
