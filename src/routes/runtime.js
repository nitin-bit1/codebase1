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
