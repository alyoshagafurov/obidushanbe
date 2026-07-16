import { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../lib/errors';
import { logger } from '../lib/logger';
import { isProd } from '../config/env';

/** Единый обработчик ошибок: приводит всё к JSON { error: { message, code, details } }. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: { message: err.message, code: err.code, details: err.details },
    });
  }

  // Известные ошибки Prisma -> человекочитаемые коды
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return res.status(409).json({ error: { message: 'Запись уже существует', code: 'CONFLICT' } });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: { message: 'Не найдено', code: 'NOT_FOUND' } });
    }
  }

  logger.error('Необработанная ошибка', { error: String(err), stack: (err as Error)?.stack });
  const e = err as { name?: string; code?: string; message?: string };
  return res.status(500).json({
    error: {
      message: isProd ? 'Внутренняя ошибка сервера' : String(e?.message ?? err),
      code: 'INTERNAL',
      // ВРЕМЕННО: диагностика прод-500 (убрать после отладки).
      debug: { name: e?.name, prismaCode: e?.code, message: String(e?.message ?? err) },
    },
  });
}

/** 404 для несуществующих маршрутов. */
export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: { message: 'Маршрут не найден', code: 'NOT_FOUND' } });
}
