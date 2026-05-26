# ─────────────────────────────────────────────────────────────
# TravelAgencyWeb API — Node 20 + Prisma + Express
# ─────────────────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache openssl
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci --omit=dev && npx prisma generate

FROM node:20-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache openssl tini curl \
 && addgroup -S app && adduser -S app -G app \
 && mkdir -p /app/uploads /app/logs \
 && chown -R app:app /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .
RUN chown -R app:app /app
USER app

ENV NODE_ENV=production
ENV PORT=3027
ENV UPLOAD_DIR=/app/uploads
ENV LOG_DIR=/app/logs
EXPOSE 3027

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS http://127.0.0.1:3027/api/health || exit 1

ENTRYPOINT ["/sbin/tini","--"]
CMD ["sh","-c","npx prisma migrate deploy && node src/index.js"]
