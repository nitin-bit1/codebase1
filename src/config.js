export const config = {
  port: Number(process.env.PORT) || 8080,
  host: process.env.HOST || '0.0.0.0',
  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
  services: {
    auth: process.env.AUTH_SERVICE_URL,
    spool: process.env.SPOOL_SERVICE_URL,
    thread: process.env.THREAD_SERVICE_URL,
    binder: process.env.BINDER_SERVICE_URL,
  },
};
