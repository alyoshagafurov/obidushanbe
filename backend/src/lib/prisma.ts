import { PrismaClient } from '@prisma/client';
import { isDev } from '../config/env';

/** Единый экземпляр Prisma Client. Все запросы — только через Prisma (защита от SQL-инъекций). */
export const prisma = new PrismaClient({
  log: isDev ? ['warn', 'error'] : ['error'],
});
