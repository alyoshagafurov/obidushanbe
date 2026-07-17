/**
 * Идемпотентный запуск демо-сида ТОЛЬКО на пустой базе.
 * Используется при старте контейнера: если пользователей нет — заливаем
 * команду + месяц демо-данных; если уже есть — ничего не трогаем.
 * Так на проде номера ролей работают сразу, а рестарт не плодит дубли.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function run() {
  const count = await prisma.user.count();
  if (count > 0) {
    console.log(`[seed-if-empty] в базе уже ${count} пользователей — пропускаю сид`);
    return;
  }
  console.log('[seed-if-empty] база пуста — запускаю демо-сид (команда + месяц данных)');
  // seed-demo.ts сам вызывает main() при импорте; ждём завершения его работы.
  await import('./seed-demo');
}

run()
  .catch((e) => {
    console.error('[seed-if-empty] ошибка:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
