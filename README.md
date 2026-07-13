# ОБИ ДУШАНБЕ — приложение доставки воды

Мобильное приложение (iOS + Android из одного кода) для службы доставки воды в Душанбе.
Оплата — **наличными при доставке**; деньги в приложении не обрабатываются.

Четыре роли: **Клиент**, **Доставщик**, **Оператор**, **Владелец/Админ**.

## Содержание

- [Стек](#стек)
- [Структура репозитория](#структура-репозитория)
- [Быстрый старт (локально)](#быстрый-старт-локально)
- [Тестовые аккаунты](#тестовые-аккаунты)
- [Переменные окружения](#переменные-окружения)
- [Деплой бэкенда на Railway](#деплой-бэкенда-на-railway)
- [Сборка iOS/Android (EAS)](#сборка-iosandroid-eas)
- [Что нужно подставить самому](#что-нужно-подставить-самому)
- [Безопасность](#безопасность)
- [Идеи для будущих версий](#идеи-для-будущих-версий)

## Стек

| Слой | Технологии |
|------|-----------|
| Мобайл | React Native + Expo (TypeScript), React Navigation, React Query, Zustand |
| Бэкенд | Node.js + Express (TypeScript), REST API |
| БД | PostgreSQL + Prisma ORM |
| Реалтайм | WebSocket (Socket.IO) |
| Карты | Абстракция `AppMap` (по умолчанию react-native-maps; провайдер меняется в конфиге: google / 2gis / yandex) |
| Аутентификация | JWT (access + refresh), вход по телефону + SMS-код |
| Хранилище файлов | Абстракция (local / S3-совместимое: Cloudflare R2 или AWS S3) |
| SMS | Абстракция (dev / OsonSMS / Twilio) |

## Структура репозитория

```
obi-dushanbe/                 (монорепо, npm workspaces)
├── shared/                   общие TypeScript-типы и enum (используются и mobile, и backend)
├── backend/                  Express API + Prisma + Socket.IO
│   ├── prisma/
│   │   ├── schema.prisma     модель БД
│   │   ├── migrations/       начальная миграция (0_init)
│   │   └── seed.ts           тестовые данные
│   ├── src/
│   │   ├── config/           загрузка и валидация .env (Zod)
│   │   ├── lib/              prisma, jwt, logger, errors
│   │   ├── middleware/       auth (RBAC), validate (Zod), rate-limit, errorHandler
│   │   ├── services/         auth, order (атомарное взятие), sms, storage, stats, mappers
│   │   ├── realtime/         Socket.IO (комнаты, события)
│   │   ├── routes/           auth, users, products, orders, couriers, reviews, chat, operator, admin
│   │   ├── app.ts            сборка Express
│   │   └── index.ts          точка входа (HTTP + WS)
│   ├── Dockerfile            готов под Railway
│   └── .env.example
├── mobile/                   Expo-приложение
│   ├── App.tsx
│   ├── app.json              конфиг Expo (имя, иконки, ключ карт, extra)
│   └── src/
│       ├── theme.ts          ★ ТЕМА-ЗАГЛУШКА: цвета/шрифты/логотип
│       ├── i18n/             ★ ЛОКАЛИЗАЦИЯ (русский; легко добавить таджикский)
│       ├── config.ts         apiUrl, провайдер и ключ карт
│       ├── api/              типизированные обёртки над REST
│       ├── store/            Zustand (auth, корзина)
│       ├── lib/              api-клиент (refresh токенов), secure-store, socket, формат
│       ├── maps/             ★ АБСТРАКЦИЯ КАРТ (AppMap)
│       ├── components/       UI-примитивы и виджеты, AddressEditor (3 способа адреса)
│       ├── hooks/            геолокация, реалтайм-заказы
│       ├── navigation/       роутинг по ролям
│       └── screens/          экраны: auth / client / courier / operator / admin / shared
├── railway.json
└── README.md
```

## Быстрый старт (локально)

### 0. Требования

- Node.js ≥ 20
- PostgreSQL ≥ 14 (локально или в Docker)
- Для мобайла: приложение **Expo Go** на телефоне ИЛИ Android/iOS-эмулятор

### 1. Установка зависимостей (из корня)

```bash
npm install
```

> `postinstall` автоматически собирает пакет `shared`.

### 2. Поднять PostgreSQL (если нет своего)

```bash
docker run --name obi-pg -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=obi -p 5432:5432 -d postgres:16
```

### 3. Настроить и запустить бэкенд

```bash
cd backend
cp .env.example .env
# отредактируйте .env: DATABASE_URL и сгенерируйте JWT-секреты:
#   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

npm run prisma:generate     # сгенерировать Prisma Client
npm run prisma:migrate      # применить миграции (создаст таблицы)  ← в dev
npm run prisma:seed         # тестовые данные
npm run dev                 # старт API на http://localhost:4000
```

Проверка: открыть `http://localhost:4000/health` → `{ "ok": true }`.

### 4. Запустить мобильное приложение

```bash
cd mobile
cp .env.example .env
# ВАЖНО: на реальном телефоне localhost не работает — укажите IP вашего ПК:
#   EXPO_PUBLIC_API_URL=http://192.168.x.x:4000

npm run start               # откроется Expo (QR-код)
```

Отсканируйте QR в **Expo Go** (телефон в той же сети) или нажмите `a`/`i` для эмулятора.

### 5. Запустить веб-сайт (лендинг + веб-кабинет)

```bash
cd web
cp .env.example .env       # VITE_API_URL=http://localhost:4000
npm run dev                # откроется на http://localhost:5173
```

Веб использует **тот же бэкенд и API**, что и приложение, — данные и логика идентичны.
На `/` — лендинг компании, на `/login` — вход/регистрация, дальше `/app/*` — кабинет
по роли (клиент/доставщик/оператор/кассир/админ). Карты на вебе — OpenStreetMap
(Leaflet), без ключа.

### Демо-данные (для показа «как будто месяц работы»)

```bash
cd backend
npx prisma migrate reset --force --skip-seed
npm run prisma:seed:demo    # ~350 заказов за 30 дней, отзывы, зарплата, выплаты
```

Вход (код `0000`): админ `+992900000001`, кассир `+992900000009`,
оператор `+992900000002`, курьеры `+992900000003…007`.

## Регистрация и роли

Вход — по номеру телефона. В **dev-режиме SMS-код всегда `0000`**.
При первом входе пользователь вводит имя и **выбирает роль**:

| Роль | Доступ |
|------|--------|
| **Клиент** | активен сразу |
| **Доставщик** | активируется после подтверждения админом |
| **Оператор** | активируется после подтверждения админом |
| **Кассир** | активируется после подтверждения админом; считает зарплату доставщиков |
| **Админ** | только по секретному коду `ADMIN_REGISTER_CODE` из `backend/.env` |

База стартует пустой (только каталог товаров). Первым зарегистрируйте **админа**
по коду, затем он подтверждает доставщиков/операторов/кассиров (Управление →
соответствующий раздел → «Подтвердить»). Админ также может добавлять сотрудников вручную.

### Кассир (зарплата)
Кассир каждый вечер вписывает, сколько бутылей 20л доставил каждый доставщик.
Система считает сумму (бутыли × индивидуальная ставка, по умолчанию 1.6 смн) и
копит «копилку» (заработано − выплачено). Ставка задаётся отдельно по каждому
доставщику (дальнобойщикам — больше). Кнопка «Выплатить» обнуляет копилку.

## Переменные окружения

### Backend (`backend/.env`)

| Переменная | Назначение |
|-----------|-----------|
| `DATABASE_URL` | строка подключения PostgreSQL |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | секреты JWT (длинные случайные) |
| `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL` | сроки жизни токенов (`15m`, `30d`) |
| `CORS_ORIGINS` | разрешённые origin (через запятую) или `*` |
| `SMS_PROVIDER` | `dev` \| `osonsms` \| `twilio` |
| `SMS_API_URL`, `SMS_API_KEY`, `SMS_SENDER` | данные SMS-провайдера |
| `STORAGE_PROVIDER` | `local` \| `s3` |
| `S3_ENDPOINT`, `S3_REGION`, `S3_BUCKET`, `S3_ACCESS_KEY_ID`, `S3_SECRET_ACCESS_KEY`, `S3_PUBLIC_URL` | для S3/Cloudflare R2 |

### Mobile (`mobile/.env` или `app.json → expo.extra`)

| Переменная | Назначение |
|-----------|-----------|
| `EXPO_PUBLIC_API_URL` | адрес бэкенда |
| `EXPO_PUBLIC_WS_URL` | адрес WebSocket (по умолчанию = API) |
| `EXPO_PUBLIC_MAP_PROVIDER` | `google` \| `2gis` \| `yandex` |
| `EXPO_PUBLIC_MAP_API_KEY` | ключ карт |

## Деплой бэкенда на Railway

1. Создайте проект на [Railway](https://railway.app) и добавьте плагин **PostgreSQL** — он даст `DATABASE_URL`.
2. Подключите репозиторий. Railway увидит `railway.json` и соберёт образ из `backend/Dockerfile`
   (контекст сборки — корень репо).
3. В переменных сервиса задайте: `DATABASE_URL` (ссылка на плагин), `JWT_ACCESS_SECRET`,
   `JWT_REFRESH_SECRET`, `CORS_ORIGINS`, `NODE_ENV=production` и (при необходимости) `SMS_*`, `S3_*`.
4. При старте контейнер автоматически применяет миграции (`prisma migrate deploy`) и поднимает сервер.
   Healthcheck — `GET /health`.
5. Сид в проде запускать **не нужно** (это тестовые данные). Первого админа создайте вручную в БД
   или временно засидируйте.

Локальная проверка Docker-сборки:

```bash
docker build -f backend/Dockerfile -t obi-backend .
docker run -p 4000:4000 --env-file backend/.env obi-backend
```

## Сборка iOS/Android (EAS)

```bash
npm i -g eas-cli
cd mobile
eas login
eas build:configure
eas build --platform android      # APK/AAB
eas build --platform ios          # нужен аккаунт Apple Developer
```

Перед сборкой проверьте в `mobile/app.json`:
- `expo.android.package`, `expo.ios.bundleIdentifier`;
- ключ Google Maps в `expo.android.config.googleMaps.apiKey` (для карт на Android);
- `expo.extra.apiUrl` — продакшн-адрес бэкенда.

> Карты `react-native-maps` и геолокация требуют **dev-build/EAS** (в Expo Go часть нативных
> функций ограничена). Для 2ГИС/Яндекс — см. раздел ниже.

## Что нужно подставить самому

| Что | Где |
|-----|-----|
| **Цвета, шрифты, логотип** | `mobile/src/theme.ts` (поменяйте `colors`, `brand.logo`, `typography`) |
| **Ключ карты + провайдер** | `mobile/app.json → expo.extra` и/или `mobile/.env`; для Android Google — `app.json → android.config.googleMaps.apiKey` |
| **2ГИС / Яндекс.Карты** | реализовать ветку в `mobile/src/maps/AppMap.tsx` (интерфейс менять не нужно) |
| **SMS-провайдер** | `backend/src/services/sms.service.ts` (готовы заготовки OsonSMS/Twilio) + `SMS_*` в `.env` |
| **Хранилище фото** | `STORAGE_PROVIDER=s3` + `S3_*` в `.env` (Cloudflare R2 / AWS S3) |
| **Фото товаров** | загрузка через `POST /api/users/me/upload-url` (presigned), затем `photoUrl` в товаре |
| **JWT-секреты** | `backend/.env` (обязательно поменять на проде) |

## Безопасность

Реализовано:

- **JWT** access (короткий) + refresh (с ротацией); токены в `expo-secure-store` (Keychain/Keystore), не в AsyncStorage.
- **RBAC** на каждом эндпоинте — роль проверяется на сервере.
- **Валидация всего ввода** через Zod.
- **Только Prisma** (параметризованные запросы) — нет сырого SQL.
- **Rate limiting** (особо жёсткий на вход/SMS).
- **SMS-коды** хранятся хешированными (bcrypt), с TTL 5 мин и лимитом попыток.
- **helmet**, строгий **CORS**, ограничение размера тела запроса.
- **Атомарное взятие заказа** (compare-and-set) — защита от двойного взятия.
- **Журнал** подозрительных событий (`SecurityLog`).
- **Минимизация данных**: телефон доставщика клиенту не отдаётся; телефон клиента — только взявшему заказ доставщику/оператору/админу.
- **Чаты**: доступ к сообщениям проверяется на сервере (только участники).

## Идеи для будущих версий

- Оптимизация маршрута доставщика (TSP / API маршрутизации) — место отмечено `TODO` в `CourierMapScreen`.
- Push-уведомления (expo-notifications): новый заказ доставщику, смена статуса клиенту.
- Таджикский язык — добавить `mobile/src/i18n/tg.ts` (структура уже готова).
- Веб-версия админ-панели (бэкенд тот же; можно сделать на React + та же абстракция API).
- Нативная интеграция 2ГИС/Яндекс.Карт.
- Онлайн-статус и геопозиция доставщика на карте у клиента.
- Аналитика и экспорт отчётов (CSV/Excel).
