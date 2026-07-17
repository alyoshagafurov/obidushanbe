/** Точка входа: HTTP-сервер + WebSocket (Socket.IO). */
import 'dotenv/config';
import { createServer } from 'http';
import { createApp } from './app';
import { initRealtime } from './realtime/socket';
import { env } from './config/env';
import { logger } from './lib/logger';
import { prisma } from './lib/prisma';
import { ensureSchema } from './lib/ensureSchema';

async function main() {
  const app = createApp();
  const server = createServer(app);

  // Поднимаем реалтайм на том же HTTP-сервере.
  initRealtime(server);

  server.listen(env.PORT, () => {
    logger.info(`🚀 ОБИ ДУШАНБЕ API запущен`, { port: env.PORT, env: env.NODE_ENV });
    // Готовим схему в фоне: сервер уже слушает, поэтому healthcheck не отвалится,
    // а прогресс виден в /health.
    void ensureSchema();
  });

  // Аккуратное завершение.
  const shutdown = async (signal: string) => {
    logger.info(`Получен ${signal}, останавливаемся...`);
    server.close();
    await prisma.$disconnect();
    process.exit(0);
  };
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));
}

main().catch((e) => {
  logger.error('Критическая ошибка запуска', { error: String(e) });
  process.exit(1);
});
