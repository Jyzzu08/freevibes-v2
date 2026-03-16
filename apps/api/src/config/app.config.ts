const isProduction = process.env.NODE_ENV === 'production';

const accessSecret =
  process.env.JWT_ACCESS_SECRET ??
  (isProduction ? undefined : 'change-me-access');
const refreshSecret =
  process.env.JWT_REFRESH_SECRET ??
  (isProduction ? undefined : 'change-me-refresh');

if (!accessSecret || !refreshSecret) {
  throw new Error(
    'JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be defined for production-like environments.',
  );
}

export default () => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.API_PORT ?? 3001),
  webUrl: process.env.WEB_URL ?? 'http://localhost:3000',
  allowedOrigins: (
    process.env.ALLOWED_ORIGINS ??
    process.env.WEB_URL ??
    'http://localhost:3000'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  localStorageBaseUrl:
    process.env.LOCAL_STORAGE_BASE_URL ?? 'http://localhost:3001/uploads',
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  jwt: {
    accessSecret,
    refreshSecret,
    accessTtl: process.env.JWT_ACCESS_TTL ?? '15m',
    refreshTtl: process.env.JWT_REFRESH_TTL ?? '30d',
    refreshCookieName:
      process.env.REFRESH_TOKEN_COOKIE_NAME ?? 'freevibes_refresh_token',
  },
  redisUrl: process.env.REDIS_URL ?? 'redis://redis:6379',
});
