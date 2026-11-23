import { config } from '../config.js';
import { requireAuth } from '../middleware/requireAuth.js';

export default async function hubRoutes(fastify) {
  // 1. Root Hub Container (/) - Shared root config & consistent navigation bar
  fastify.get('/', async (request, reply) => {
    reply.type('text/html');
    return `
      <!DOCTYPE html>
      <html>
        <head><title>Bobbin Hub</title></head>
        <body style="font-family: sans-serif; margin: 2rem;">
          <nav style="display:flex; gap:1rem; padding:1rem; background:#f1f5f9; border-radius:8px;">
            ${config.navigation.map(item => `<a href="${item.path}">${item.label} ${item.requiresAuth ? '🔒' : ''}</a>`).join('')}
          </nav>
          <h1>Bobbin Hub Container (/)</h1>
          <p>Replica ID: <strong>${process.env.HOSTNAME || 'local'}</strong></p>
          <pre>${JSON.stringify(config.navigation, null, 2)}</pre>
        </body>
      </html>
    `;
  });

  // 2. Shared Navigation & Root Config API (consumed by TH, AC, FL bundles)
  fastify.get('/api/root-config', async () => {
    return {
      domain: 'single-domain',
      navigation: config.navigation,
      apps: {
        th: { basePath: '/apps/th', loginEnabled: true },
        ac: { basePath: '/apps/ac', loginEnabled: false },
        fl: { basePath: '/apps/fl', loginEnabled: false },
      },
    };
  });

  // 3. TH Container Auth & Proxy Routes (/apps/th/api/*) - Login Enabled
  fastify.register(async function thProtectedRoutes(thScope) {
    thScope.addHook('preHandler', requireAuth);

    thScope.get('/apps/th/api/profile', async (request) => {
      return {
        app: 'TH Container',
        authenticated: true,
        session: request.userSession || { user: 'forgerock-bearer-user' },
        handledByReplica: process.env.HOSTNAME || 'local',
      };
    });

    // Proxy route forwarding TH requests to Binder / Backend APIs
    thScope.all('/apps/th/api/proxy/*', async (request) => {
      return {
        proxiedFrom: '/apps/th',
        target: config.services.binder || 'binder-service',
        path: request.params['*'],
        replica: process.env.HOSTNAME || 'local',
      };
    });
  });
}
