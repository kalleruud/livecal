FROM oven/bun:1 AS builder
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile
COPY . .

FROM oven/bun:1-slim
WORKDIR /app

RUN mkdir -p /app/cache

COPY --from=builder /app/src ./src
COPY --from=builder /app/package.json ./
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production
ENV PORT=6699

EXPOSE 6699

CMD ["bun", "run", "src/index.ts"]
