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
