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
