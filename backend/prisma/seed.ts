/**
 * Сид: только реальный каталог товаров. Никаких демо-пользователей и заказов.
 *
 * Пользователи создаются через регистрацию в приложении:
 *  - Клиент / Доставщик / Оператор — выбирают роль при регистрации
 *    (доставщик/оператор активируются после подтверждения админом);
 *  - Админ — регистрируется по секретному коду ADMIN_REGISTER_CODE (см. .env).
 *
 * Фото товаров: если photoUrl не задан, приложение показывает встроенное фото
 * по типу товара. Загрузить своё фото можно в админке (Управление → Товары).
 */
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Сидирование каталога...');

  const productData: Prisma.ProductCreateInput[] = [
    { name: 'Вода 20 л', type: 'WATER_20L', price: '18.00', sortOrder: 1 },
    { name: 'Вода 0.5 л (упаковка 12 шт)', type: 'WATER_05L', price: '36.00', sortOrder: 2 },
    { name: 'Кулер для воды (напольный)', type: 'COOLER', price: '950.00', sortOrder: 3 },
    { name: 'Помпа ручная', type: 'PUMP_MANUAL', price: '45.00', sortOrder: 4 },
    { name: 'Помпа электрическая', type: 'PUMP_ELECTRIC', price: '120.00', sortOrder: 5 },
  ];

  for (const p of productData) {
    const existing = await prisma.product.findFirst({ where: { name: p.name } });
    if (existing) {
      await prisma.product.update({ where: { id: existing.id }, data: p });
    } else {
      await prisma.product.create({ data: p });
    }
  }

  console.log(`✅ Готово. Товаров в каталоге: ${await prisma.product.count()}`);
  console.log('   Зарегистрируйтесь в приложении и выберите роль.');
  console.log('   Для роли «Админ» нужен код ADMIN_REGISTER_CODE из backend/.env.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
