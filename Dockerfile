FROM oven/bun:1 AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .

FROM oven/bun:1-slim
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 bunjs
USER bunjs

COPY --from=builder --chown=bunjs:nodejs /app/src ./src
COPY --from=builder --chown=bunjs:nodejs /app/package.json ./
COPY --from=builder --chown=bunjs:nodejs /app/node_modules ./node_modules

RUN mkdir -p /app/cache

ENV NODE_ENV=production
ENV PORT=6699

EXPOSE 6699

CMD ["bun", "run", "src/index.ts"]
