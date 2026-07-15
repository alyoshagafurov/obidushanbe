# ОБИ ДУШАНБЕ — backend (Express) + раздача веб-сайта. Готов под Railway.
# ВАЖНО: сборка идёт из КОРНЯ монорепо (context = repo root):
#   docker build -f backend/Dockerfile .
# Один сервис отдаёт и API (/api, /health), и сам сайт (/, /login, /app/...).

FROM node:20-slim AS base
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---- deps: зависимости ТОЛЬКО shared + backend ----
# Манифесты всех воркспейсов нужны, чтобы npm построил граф. Сборка тут НЕ идёт.
FROM base AS deps
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/
COPY mobile/package.json ./mobile/
COPY web/package.json ./web/
RUN npm install --workspace shared --workspace backend --include-workspace-root=false

# ---- build: собираем shared -> backend ----
FROM deps AS build
COPY shared ./shared
COPY backend ./backend
RUN npm run build --workspace shared \
  && npm run build --workspace backend

# ---- webbuild: собираем статический сайт (Vite) ----
# Пустой VITE_API_URL => сайт ходит в /api того же домена (same-origin, без CORS/WS-проблем).
FROM base AS webbuild
COPY package.json package-lock.json ./
COPY shared/package.json ./shared/
COPY backend/package.json ./backend/
COPY mobile/package.json ./mobile/
COPY web/package.json ./web/
RUN npm install --workspace web --include-workspace-root=false
COPY shared ./shared
COPY web ./web
ENV VITE_API_URL=""
RUN npm run build --workspace web

# ---- runtime ----
FROM base AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=build /app ./
COPY --from=webbuild /app/web/dist ./web/dist
WORKDIR /app/backend
EXPOSE 4000
# Накатываем миграции и запускаем сервер (он же раздаёт сайт).
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/index.js"]
