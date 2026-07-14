# ОБИ ДУШАНБЕ — backend (Express). Готов под Railway.
# ВАЖНО: сборка идёт из КОРНЯ монорепо (context = repo root):
#   docker build -f backend/Dockerfile .
# Railway использует backend/Dockerfile с контекстом корня (см. railway.json).

FROM node:20-slim AS base
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---- deps: ставим зависимости ТОЛЬКО shared + backend ----
# Копируем манифесты ВСЕХ воркспейсов, чтобы npm смог построить граф воркспейсов
# (иначе `npm -w shared -w backend` падает из-за отсутствующих mobile/web).
# Сборка shared здесь НЕ запускается (postinstall убран) — исходников ещё нет.
FROM base AS deps
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/
COPY mobile/package.json ./mobile/
COPY web/package.json ./web/
RUN npm install --workspace shared --workspace backend --include-workspace-root=false

# ---- build: копируем исходники и собираем shared -> backend ----
# shared собирается ПЕРВЫМ (backend импортирует @obi/shared -> dist/index.js).
# `npm run build` в backend делает `prisma generate && tsc`.
FROM deps AS build
COPY shared ./shared
COPY backend ./backend
RUN npm run build --workspace shared \
  && npm run build --workspace backend

# ---- runtime ----
# Копируем весь результат сборки (все node_modules всех уровней + dist + prisma),
# чтобы гарантированно ничего не потерять при разрешении модулей.
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=build /app ./
WORKDIR /app/backend
EXPOSE 4000
# Накатываем миграции и запускаем сервер.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
