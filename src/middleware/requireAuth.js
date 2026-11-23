// Enforces login only for protected routes (e.g., /apps/th) using shared Redis sessions
export async function requireAuth(request, reply) {
  const sessionId = request.headers['x-session-id'] || request.query.sessionId;
  const authHeader = request.headers.authorization;

  if (!sessionId && !authHeader) {
    return reply.code(401).send({
      error: 'Authentication required for TH Container',
      loginRedirect: '/auth/login?redirect=/apps/th',
    });
  }

  if (sessionId) {
    const sessionData = await request.server.redis.get(`bobbin:session:${sessionId}`);
    if (!sessionData) {
      return reply.code(401).send({ error: 'Session expired or invalid' });
    }
    request.userSession = JSON.parse(sessionData);
  }
}
