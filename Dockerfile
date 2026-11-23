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
