/** Сборка Express-приложения: безопасность, маршруты, обработка ошибок. */
import path from 'path';
import fs from 'fs';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { corsOrigins } from './config/env';
import { uploadsRouter, UPLOADS_DIR } from './routes/uploads.routes';
import { globalLimiter } from './middleware/rateLimit';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

import { authRouter } from './routes/auth.routes';
import { userRouter } from './routes/user.routes';
import { productRouter } from './routes/product.routes';
import { orderRouter } from './routes/order.routes';
import { courierRouter } from './routes/courier.routes';
import { reviewRouter } from './routes/review.routes';
import { chatRouter } from './routes/chat.routes';
import { operatorRouter } from './routes/operator.routes';
import { adminRouter } from './routes/admin.routes';
import { cashierRouter } from './routes/cashier.routes';

export function createApp() {
  const app = express();

  // За прокси (Railway) — доверяем заголовку для корректного req.ip и rate-limit.
  app.set('trust proxy', 1);

  // Заголовки безопасности. CSP выключен, т.к. с этого же сервера отдаётся
  // SPA-сайт (иначе строгий CSP ломает загрузку его ассетов). CORP=cross-origin,
  // чтобы картинки из /uploads грузились и в мобильном приложении (другой origin).
  app.use(
    helmet({
      contentSecurityPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Строгий CORS: либо '*', либо явный список origin из .env.
  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
    }),
  );

  // Ограничение размера тела запроса (защита от больших payload).
  app.use(express.json({ limit: '1mb' }));

  // Глобальный rate-limit.
  app.use(globalLimiter);

  // Health-check (для Railway / мониторинга).
  app.get('/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

  // Локальное хранилище файлов (раздача загруженных картинок + приём загрузок).
  app.use('/uploads', express.static(UPLOADS_DIR));
  app.use('/api/uploads', uploadsRouter);

  // API.
  app.use('/api/auth', authRouter);
  app.use('/api/users', userRouter);
  app.use('/api/products', productRouter);
  app.use('/api/orders', orderRouter);
  app.use('/api/couriers', courierRouter);
  app.use('/api/reviews', reviewRouter);
  app.use('/api/chat', chatRouter);
  app.use('/api/operator', operatorRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/cashier', cashierRouter);

  // JSON-404 только для несуществующих /api/* маршрутов.
  app.use('/api', notFoundHandler);

  // Раздача собранного веб-сайта (если он есть в образе): статика + SPA-fallback,
  // чтобы клиентские маршруты (/, /login, /app/...) открывались по прямой ссылке.
  const webDist = process.env.WEB_DIST ?? path.resolve(process.cwd(), '..', 'web', 'dist');
  const webIndex = path.join(webDist, 'index.html');
  if (fs.existsSync(webIndex)) {
    app.use(express.static(webDist));
    app.get('*', (_req, res) => res.sendFile(webIndex));
  }

  // Финальный 404 (для не-GET запросов или когда сайт не собран) и обработчик ошибок.
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
