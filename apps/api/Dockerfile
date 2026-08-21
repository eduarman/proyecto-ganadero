FROM node:22-slim AS base
RUN corepack enable
WORKDIR /app
# Puppeteer (módulo reportes) cachea el Chromium descargado acá — se fija
# explícitamente para poder copiar el mismo path del stage build al runner.
ENV PUPPETEER_CACHE_DIR=/app/.cache/puppeteer

FROM base AS build
COPY package.json pnpm-workspace.yaml ./
COPY prisma ./prisma
# `unzip` es requerido por @puppeteer/browsers para extraer el Chromium
# descargado durante el postinstall — sin esto, el postinstall falla
# silenciosamente y el runner queda sin navegador.
RUN apt-get update && apt-get install -y --no-install-recommends unzip \
    && rm -rf /var/lib/apt/lists/*
RUN corepack pnpm install
COPY . .
RUN corepack pnpm run prisma:generate
RUN corepack pnpm run build

FROM base AS runner
ENV NODE_ENV=production

# Librerías de sistema que necesita el Chromium embebido de Puppeteer en
# runtime (módulo reportes, exportación a PDF) — node:22-slim no las trae.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 \
    libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 \
    libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 \
    libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 \
    libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 \
    libxtst6 wget xdg-utils \
    && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/.cache/puppeteer ./.cache/puppeteer
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/package.json ./package.json

CMD ["node", "dist/main.js"]
