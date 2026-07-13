# ОБИ ДУШАНБЕ — backend (Express). Готов под Railway.
# Сборка из КОРНЯ монорепо: docker build -f backend/Dockerfile .

FROM node:20-slim AS base
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---- deps ----
FROM base AS deps
COPY package.json package-lock.json* ./
COPY shared/package.json shared/package.json
COPY backend/package.json backend/package.json
# mobile не нужен для backend-сборки — ставим только нужные воркспейсы
RUN npm install --workspace shared --workspace backend --include-workspace-root=false || npm install

# ---- build ----
FROM deps AS build
COPY shared shared
COPY backend backend
RUN npm run build --workspace shared
# Генерация Prisma Client + компиляция TS
RUN npm run build --workspace backend

# ---- runtime ----
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/shared/dist ./shared/dist
COPY --from=build /app/shared/package.json ./shared/package.json
COPY --from=build /app/backend/dist ./backend/dist
COPY --from=build /app/backend/package.json ./backend/package.json
COPY --from=build /app/backend/prisma ./backend/prisma
COPY --from=build /app/backend/node_modules/.prisma ./backend/node_modules/.prisma

WORKDIR /app/backend
EXPOSE 4000
# Накатываем миграции и запускаем сервер.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
