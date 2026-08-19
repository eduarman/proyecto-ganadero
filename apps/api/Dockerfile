FROM node:22-slim AS base
RUN corepack enable
WORKDIR /app

FROM base AS build
COPY package.json pnpm-workspace.yaml ./
COPY prisma ./prisma
RUN corepack pnpm install
COPY . .
RUN corepack pnpm run prisma:generate
RUN corepack pnpm run build

FROM base AS runner
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json

CMD ["node", "dist/main.js"]
