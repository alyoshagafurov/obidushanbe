/** Сборка Express-приложения: безопасность, маршруты, обработка ошибок. */
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

  // Заголовки безопасности. CORP=cross-origin, чтобы картинки из /uploads
  // могли грузиться в мобильном приложении (другой origin).
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

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

  // 404 и единый обработчик ошибок (последними).
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
