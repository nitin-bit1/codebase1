export const config = {
  port: Number(process.env.PORT) || 8080,
  host: process.env.HOST || '0.0.0.0',
  redisUrl: process.env.REDIS_URL || 'redis://redis:6379',
  services: {
    auth: process.env.AUTH_SERVICE_URL || 'http://localhost:8080/mock-auth',
    spool: process.env.SPOOL_SERVICE_URL || '',
    thread: process.env.THREAD_SERVICE_URL || '',
    binder: process.env.BINDER_SERVICE_URL || '',
  },
  // Consistent navigation manifest shared across Hub, TH, AC, and FL
  navigation: [
    { id: 'hub', label: 'Hub Home', path: '/', requiresAuth: false },
    { id: 'th', label: 'TH Workspace', path: '/apps/th', requiresAuth: true },
    { id: 'ac', label: 'AC Portal', path: '/apps/ac', requiresAuth: false },
    { id: 'fl', label: 'FL Explorer', path: '/apps/fl', requiresAuth: false },
  ],
};
