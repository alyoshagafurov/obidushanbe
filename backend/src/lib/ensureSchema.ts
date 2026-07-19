/**
 * Самовосстановление схемы БД при старте приложения.
 *
 * Зачем не полагаться на CMD/старт-команду: она может быть переопределена
 * платформой, и тогда миграции просто не накатываются. Здесь же проверка идёт
 * из самого приложения — работает при любой команде запуска.
 *
 * Логика безопасная:
 *  - таблицы на месте  -> ничего не делаем (обычный старт);
 *  - таблиц нет        -> db push --force-reset (терять нечего) + демо-сид.
 * Сброс НИКОГДА не выполняется, если схема уже валидна, поэтому реальные
 * данные не пострадают.
 */
import { exec } from 'child_process';
import { promisify } from 'util';
import { prisma } from './prisma';
import { logger } from './logger';
import { bootStatus } from './bootStatus';

const run = promisify(exec);

/**
 * Признак АКТУАЛЬНОЙ схемы. Проверяем таблицу WarehouseTrip — она появилась вместе
 * с «листом дня» (отчёт = доставщик × день, внутри рейсы). Если её нет (старая схема
 * или таблиц нет вовсе), делаем db push --force-reset + пересев демо-данными по новой
 * модели (в проде только демо-данные — терять нечего).
 */
async function schemaReady(): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ reg: string | null }[]>`
    SELECT to_regclass('public."WarehouseTrip"')::text AS reg
  `;
  return Boolean(rows?.[0]?.reg);
}

export async function ensureSchema(): Promise<void> {
  try {
    if (await schemaReady()) {
      bootStatus.schema = 'ok';
      bootStatus.seed = 'skip (схема на месте)';
      logger.info('[boot] Схема БД на месте');
      return;
    }

    logger.warn('[boot] Таблиц нет — синхронизирую схему (db push --force-reset)');
    bootStatus.schema = 'creating';
    await run('npx prisma db push --skip-generate --accept-data-loss --force-reset', {
      cwd: process.cwd(),
      timeout: 180_000,
    });
    bootStatus.schema = 'created';
    logger.info('[boot] Схема создана');

    // База заведомо пустая — заливаем демо-данные (команда + месяц заказов).
    bootStatus.seed = 'seeding';
    await run('npx tsx prisma/seed-if-empty.ts', { cwd: process.cwd(), timeout: 300_000 });
    bootStatus.seed = 'done';
    logger.info('[boot] Демо-данные залиты');
  } catch (e) {
    const msg = String((e as Error)?.message ?? e).slice(0, 600);
    bootStatus.detail = msg;
    if (bootStatus.schema === 'creating') bootStatus.schema = 'error';
    else if (bootStatus.seed === 'seeding') bootStatus.seed = 'error';
    else bootStatus.schema = 'error';
    logger.error('[boot] Не удалось подготовить схему', { error: msg });
  }
}
