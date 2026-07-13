/**
 * Минималистичный структурированный логгер (без внешних зависимостей).
 * При желании легко заменить на pino/winston.
 */
import { isProd } from '../config/env';
import { prisma } from './prisma';

type Level = 'debug' | 'info' | 'warn' | 'error';

function log(level: Level, message: string, meta?: Record<string, unknown>) {
  if (level === 'debug' && isProd) return;
  const entry = { ts: new Date().toISOString(), level, message, ...meta };
  const line = JSON.stringify(entry);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (m: string, meta?: Record<string, unknown>) => log('debug', m, meta),
  info: (m: string, meta?: Record<string, unknown>) => log('info', m, meta),
  warn: (m: string, meta?: Record<string, unknown>) => log('warn', m, meta),
  error: (m: string, meta?: Record<string, unknown>) => log('error', m, meta),
};

/**
 * Запись подозрительного события в БД (множественные неудачные входы, спам SMS,
 * проигранная гонка за заказ и т.п.). Не бросает исключений — логирование не должно
 * ломать основной поток.
 */
export async function securityLog(params: {
  event: string;
  phone?: string | null;
  userId?: string | null;
  ip?: string | null;
  meta?: Record<string, unknown>;
}) {
  logger.warn(`[security] ${params.event}`, params);
  try {
    await prisma.securityLog.create({
      data: {
        event: params.event,
        phone: params.phone ?? null,
        userId: params.userId ?? null,
        ip: params.ip ?? null,
        meta: (params.meta ?? undefined) as object | undefined,
      },
    });
  } catch (e) {
    logger.error('Не удалось записать security-лог', { error: String(e) });
  }
}
