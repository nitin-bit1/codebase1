mkdir -p src/routes && \
npm init -y && \
npm pkg set type="module" scripts.start="node server.js" scripts.dev="node --watch server.js" && \
npm install fastify @fastify/cors @fastify/redis && \

cat << 'EOF' > src/config.js
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
EOF

cat << 'EOF' > src/routes/health.js
export default async function healthRoutes(fastify) {
  fastify.get('/health', async () => {
    return { status: 'ok', instance: process.env.HOSTNAME || 'local' };
  });

  fastify.get('/ready', async (request, reply) => {
    try {
      await fastify.redis.ping();
      return { status: 'ready' };
    } catch (err) {
      reply.code(503);
      return { status: 'not_ready', error: 'Redis unreachable' };
    }
  });
}
EOF

cat << 'EOF' > src/routes/runtime.js
import { config } from '../config.js';

export default async function runtimeRoutes(fastify) {
  fastify.post('/api/v1/execute', async (request, reply) => {
    const authHeader = request.headers.authorization;
    if (!authHeader) {
      return reply.code(401).send({ error: 'Missing ForgeRock Bearer token' });
    }

    const { sessionId, payload } = request.body || {};

    await fastify.redis.set(
      `bobbin:session:${sessionId}`,
      JSON.stringify({ lastActive: Date.now(), payload }),
      'EX',
      3600
    );

    const [spoolRes, threadRes] = await Promise.all([
      fetch(`${config.services.spool}/metadata`, { headers: { Authorization: authHeader } }),
      fetch(`${config.services.thread}/components`, { headers: { Authorization: authHeader } }),
    ]);

    return {
      status: 'executed',
      handledByReplica: process.env.HOSTNAME || 'local',
      spoolOk: spoolRes.ok,
      threadOk: threadRes.ok,
    };
  });
}
EOF

cat << 'EOF' > server.js
import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyRedis from '@fastify/redis';
import { config } from './src/config.js';
import healthRoutes from './src/routes/health.js';
import runtimeRoutes from './src/routes/runtime.js';

const app = Fastify({ logger: true });

await app.register(cors);
await app.register(fastifyRedis, { url: config.redisUrl });

await app.register(healthRoutes);
await app.register(runtimeRoutes);

const closeGracefully = async (signal) => {
  app.log.info(`Received ${signal}, shutting down Bobbin replica cleanly...`);
  await app.close();
  process.exit(0);
};
process.on('SIGINT', closeGracefully);
process.on('SIGTERM', closeGracefully);

try {
  await app.listen({ port: config.port, host: config.host });
} catch (err) {
  app.log.error(err);
  process.exit(1);
}
EOF

cat << 'EOF' > .dockerignore
node_modules
npm-debug.log
.git
.env
EOF

cat << 'EOF' > Dockerfile
FROM node:20-alpine

ENV NODE_ENV=production
ENV PORT=8080
ENV HOST=0.0.0.0
ENV REDIS_URL=""
ENV AUTH_SERVICE_URL=""
ENV SPOOL_SERVICE_URL=""
ENV THREAD_SERVICE_URL=""
ENV BINDER_SERVICE_URL=""

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node . .

USER node

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["node", "server.js"]
EOF

---------------------------------------------------------------------------------------

docker run -d --name bobbin-redis -p 6379:6379 redis:7-alpine && npm run dev

---------------------------------------------------------------------------------------

git add . && git commit -m "feat: initial stateless Bobbin Fastify runtime" && git push


