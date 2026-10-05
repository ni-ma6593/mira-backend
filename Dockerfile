# -------------------------------------------------------------
#  Multi-stage build: install (with devDependencies, needed for
#  nothing here but kept in case build steps are added later) in
#  a separate layer, then copy only what's needed into a slim
#  runtime image without devDependencies.
# -------------------------------------------------------------

FROM node:20-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev

FROM node:20-alpine AS runtime
WORKDIR /app

# Run as a non-root user (security hardening — Phase 11)
RUN addgroup -S mira && adduser -S mira -G mira

ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Own the working dir (incl. the logs/ dir winston writes to)
RUN mkdir -p /app/logs && chown -R mira:mira /app

USER mira

EXPOSE 3000

# Container-level liveness/readiness check, backed by the app's
# own /health endpoint (checks Mongo + Redis, not just the port).
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:' + (process.env.PORT || 3000) + '/health', r => process.exit(r.statusCode === 200 ? 0 : 1)).on('error', () => process.exit(1))"

# Exec form, running node directly (not via `npm start`) so SIGTERM
# reaches the Node process immediately — needed for the graceful-
# shutdown handling in index.js to actually run. NODE_ENV=production
# is already set via ENV above, so cross-env isn't needed here.
CMD ["node", "index.js"]
