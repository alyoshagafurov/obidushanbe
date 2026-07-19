/**
 * ДЕМО-ДАННЫЕ «как будто сайт работает месяц».
 * Создаёт команду, ~40 клиентов и ~300 заказов за последние 30 дней с отзывами,
 * зарплатными записями кассира и выплатами. Для демонстрации владельцу.
 *
 * Запуск на чистой БД:
 *   npm run prisma:migrate -- (или reset) && npm run prisma:seed:demo
 */
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

const MALE = ['Рустам', 'Фаррух', 'Алишер', 'Сухроб', 'Джамшед', 'Бехруз', 'Фирдавс', 'Далер', 'Нозим', 'Шоҳрух', 'Комрон', 'Умед'];
const FEMALE = ['Зарина', 'Мадина', 'Манижа', 'Нигина', 'Сабрина', 'Мохира', 'Гулнора', 'Ситора', 'Дилноза', 'Фарзона'];
const STREETS = [
  { text: 'пр. Рудаки', lat: 38.5731, lng: 68.7864 },
  { text: 'ул. Айни', lat: 38.559, lng: 68.77 },
  { text: 'пр. Исмоили Сомони', lat: 38.58, lng: 68.79 },
  { text: 'ул. Турсунзаде', lat: 38.565, lng: 68.78 },
  { text: 'ул. Фирдавси', lat: 38.552, lng: 68.762 },
  { text: 'ул. Насими', lat: 38.585, lng: 68.805 },
  { text: 'ул. Борбад', lat: 38.548, lng: 68.81 },
  { text: 'ул. Дружбы народов', lat: 38.576, lng: 68.744 },
  { text: 'ул. Нахимова', lat: 38.541, lng: 68.79 },
  { text: 'мкр. Зарафшон', lat: 38.59, lng: 68.75 },
];
const LANDMARKS = ['возле школы', 'синий дом за базаром', 'домофон не работает — позвонить', 'рядом с аптекой', 'угловой подъезд', '2-й этаж', 'напротив парка', ''];
const REVIEW_TEXTS = ['Спасибо, быстро!', 'Всё отлично', 'Вежливый курьер', 'Привезли вовремя', 'Хороший сервис', 'Рекомендую', 'Как всегда на высоте', '', '', ''];

const pick = <T>(a: T[]): T => a[Math.floor(Math.random() * a.length)];
const rnd = (min: number, max: number) => min + Math.floor(Math.random() * (max - min + 1));
let phoneSeq = 1000;
const nextPhone = () => `+9929${String(phoneSeq++).padStart(8, '0')}`.slice(0, 13);

async function main() {
  console.log('🌱 Демо-данные за месяц...');

  // ---- Товары ----
  const productData: Prisma.ProductCreateInput[] = [
    { name: 'Вода 20 л', type: 'WATER_20L', price: '18.00', sortOrder: 1 },
    { name: 'Вода 0.5 л (упаковка 12 шт)', type: 'WATER_05L', price: '36.00', sortOrder: 2 },
    { name: 'Кулер для воды (напольный)', type: 'COOLER', price: '950.00', sortOrder: 3 },
    { name: 'Помпа ручная', type: 'PUMP_MANUAL', price: '45.00', sortOrder: 4 },
    { name: 'Помпа электрическая', type: 'PUMP_ELECTRIC', price: '120.00', sortOrder: 5 },
  ];
  const products = [];
  for (const p of productData) {
    const ex = await prisma.product.findFirst({ where: { name: p.name } });
    products.push(ex ? await prisma.product.update({ where: { id: ex.id }, data: p }) : await prisma.product.create({ data: p }));
  }
  const water20 = products[0];

  // ---- Команда ----
  const admin = await prisma.user.upsert({ where: { phone: '+992900000001' }, update: {}, create: { phone: '+992900000001', name: 'Рустам (владелец)', role: 'ADMIN' } });
  await prisma.user.upsert({ where: { phone: '+992900000002' }, update: {}, create: { phone: '+992900000002', name: 'Мадина (оператор)', role: 'OPERATOR' } });
  const cashier = await prisma.user.upsert({ where: { phone: '+992900000009' }, update: {}, create: { phone: '+992900000009', name: 'Зарина (кассир)', role: 'CASHIER' } });

  const courierDefs = [
    { name: 'Алишер', phone: '+992900000003', rate: '1.60' },
    { name: 'Фаррух', phone: '+992900000004', rate: '1.60' },
    { name: 'Далер (дальнобой)', phone: '+992900000005', rate: '2.50' },
    { name: 'Сухроб', phone: '+992900000006', rate: '1.80' },
    { name: 'Бехруз (дальнобой)', phone: '+992900000007', rate: '2.20' },
  ];
  const couriers = [];
  for (const c of courierDefs) {
    const u = await prisma.user.upsert({
      where: { phone: c.phone }, update: {},
      create: {
        phone: c.phone, name: c.name, role: 'COURIER',
        courierProfile: { create: { bio: `Развожу воду по Душанбе. ${c.name}.`, bottleRate: new Prisma.Decimal(c.rate) } },
      },
    });
    couriers.push(u);
  }

  // ---- Клиенты с адресами ----
  const clients = [];
  for (let i = 0; i < 42; i++) {
    const female = Math.random() < 0.45;
    const name = `${pick(female ? FEMALE : MALE)} ${pick(MALE)[0]}.`;
    const st = pick(STREETS);
    const client = await prisma.user.create({
      data: {
        phone: nextPhone(), name, role: 'CLIENT',
        createdAt: new Date(Date.now() - rnd(0, 30) * 864e5),
        addresses: { create: [{ label: 'Дом', text: `${st.text} ${rnd(1, 90)}, кв. ${rnd(1, 120)}`, lat: st.lat + (Math.random() - 0.5) * 0.01, lng: st.lng + (Math.random() - 0.5) * 0.01, landmark: pick(LANDMARKS) || null }] },
      },
    });
    clients.push(client);
  }

  // ---- Заказы за 30 дней ----
  console.log('   генерирую заказы...');
  let ordersCreated = 0;
  const deliveredByCourierDay = new Map<string, number>(); // courierId|dateKey -> bottles20

  for (let d = 29; d >= 0; d--) {
    // рост к текущему дню: 6..18 заказов в день
    const perDay = rnd(6, 10) + Math.round((29 - d) * 0.25);
    for (let k = 0; k < perDay; k++) {
      const day = new Date();
      day.setDate(day.getDate() - d);
      day.setHours(rnd(8, 20), rnd(0, 59), 0, 0);
      const client = pick(clients);
      const st = pick(STREETS);
      const courier = pick(couriers);

      // состав: почти всегда вода 20л (1-4), иногда доп.товар
      const items: { productId: string; quantity: number; unitPrice: Prisma.Decimal }[] = [];
      const w20 = rnd(1, 4);
      items.push({ productId: water20.id, quantity: w20, unitPrice: water20.price });
      if (Math.random() < 0.25) { const p = pick(products.slice(1)); items.push({ productId: p.id, quantity: rnd(1, 2), unitPrice: p.price }); }
      let total = new Prisma.Decimal(0);
      items.forEach((it) => (total = total.add(it.unitPrice.mul(it.quantity))));

      // статус: последние ~1.5 дня часть в пути/новые, остальное доставлено
      let status: 'DELIVERED' | 'ON_WAY' | 'NEW' = 'DELIVERED';
      if (d === 0 && Math.random() < 0.5) status = Math.random() < 0.5 ? 'ON_WAY' : 'NEW';

      const base: Prisma.OrderCreateInput = {
        client: { connect: { id: client.id } },
        status,
        addrText: `${st.text} ${rnd(1, 90)}`,
        addrLandmark: pick(LANDMARKS) || null,
        addrLat: st.lat + (Math.random() - 0.5) * 0.01,
        addrLng: st.lng + (Math.random() - 0.5) * 0.01,
        total,
        createdAt: day,
        items: { create: items.map((it) => ({ product: { connect: { id: it.productId } }, quantity: it.quantity, unitPrice: it.unitPrice })) },
      };
      if (status !== 'NEW') { base.courier = { connect: { id: courier.id } }; base.takenAt = day; }
      if (status === 'DELIVERED') {
        const del = new Date(day); del.setMinutes(del.getMinutes() + rnd(25, 90));
        base.deliveredAt = del;
        const key = `${courier.id}|${new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate())).toISOString()}`;
        deliveredByCourierDay.set(key, (deliveredByCourierDay.get(key) ?? 0) + w20);
      }
      const order = await prisma.order.create({ data: base });
      ordersCreated++;

      // отзыв на ~62% доставленных
      if (status === 'DELIVERED' && Math.random() < 0.62) {
        await prisma.review.create({
          data: { orderId: order.id, clientId: client.id, courierId: courier.id, rating: Math.random() < 0.8 ? 5 : 4, text: pick(REVIEW_TEXTS) || null, createdAt: base.deliveredAt as Date },
        });
      }
    }
  }

  // ---- Складские отчёты кассира (ЕДИНЫЙ источник: деньги «к сдаче» + зарплата) ----
  console.log('   складские отчёты кассира и выплаты...');
  const rateByCourier = new Map(couriers.map((c) => [c.id, courierDefs.find((d) => d.phone === c.phone)!.rate]));
  const WATER = 15, BOTTLE = 50;
  const otherProducts = products.slice(1); // всё, кроме 20л
  const NOTES = ['1 бутыль с дыркой — вода вылилась', 'Клиент не открыл — вернул полную', 'Всё чисто', 'Задержался — пробки'];
  const earnedByCourier = new Map<string, number>();
  for (const [key, bottles] of deliveredByCourierDay) {
    const [courierId, dateIso] = key.split('|');
    if (bottles <= 0) continue;
    const rateStr = rateByCourier.get(courierId) ?? '1.60';
    const rateNum = Number(rateStr);
    const fullReturned = Math.random() < 0.25 ? rnd(1, 3) : 0; // часть вернул полными
    const fullTaken = bottles + fullReturned;
    const barrelSold = Math.random() < 0.4 ? rnd(1, 2) : 0; // продано с бочкой (без обмена)
    const emptyReturned = Math.max(0, bottles - barrelSold);
    const salary = Math.round(bottles * rateNum * 100) / 100;
    earnedByCourier.set(courierId, (earnedByCourier.get(courierId) ?? 0) + salary);
    const createdAt = new Date(dateIso); createdAt.setUTCHours(rnd(10, 18), rnd(0, 59));
    const withItem = Math.random() < 0.15 && otherProducts.length > 0 ? pick(otherProducts) : null;
    await prisma.warehouseReport.create({
      data: {
        courierId, cashierId: cashier.id,
        fullTaken, emptyReturned, fullReturned,
        waterPrice: new Prisma.Decimal(WATER), bottlePrice: new Prisma.Decimal(BOTTLE),
        bottleRate: new Prisma.Decimal(rateStr), salary: new Prisma.Decimal(salary),
        note: Math.random() < 0.12 ? pick(NOTES) : null,
        createdAt,
        items: withItem
          ? { create: [{ name: withItem.name, amount: new Prisma.Decimal(Number(withItem.price) * rnd(1, 3)) }] }
          : undefined,
      },
    });
  }

  // Выплаты: у каждого курьера часть копилки уже выдана (~45–70%)
  for (const c of couriers) {
    const earned = earnedByCourier.get(c.id) ?? 0;
    const payout = Math.round(earned * (0.45 + Math.random() * 0.25));
    if (payout > 0) {
      await prisma.payout.create({ data: { courierId: c.id, cashierId: cashier.id, amount: new Prisma.Decimal(payout), note: 'Зарплата за неделю', createdAt: new Date(Date.now() - rnd(3, 12) * 864e5) } });
    }
  }

  // ---- Пересчёт рейтингов и счётчиков доставок ----
  for (const c of couriers) {
    const ragg = await prisma.review.aggregate({ where: { courierId: c.id }, _avg: { rating: true }, _count: { rating: true } });
    const deliveries = await prisma.order.count({ where: { courierId: c.id, status: 'DELIVERED' } });
    await prisma.courierProfile.updateMany({ where: { userId: c.id }, data: { ratingCache: ragg._avg.rating ?? 5, reviewsCount: ragg._count.rating, deliveriesCount: deliveries } });
  }

  const totals = {
    users: await prisma.user.count(),
    orders: await prisma.order.count(),
    delivered: await prisma.order.count({ where: { status: 'DELIVERED' } }),
    reviews: await prisma.review.count(),
    revenue: (await prisma.order.aggregate({ where: { status: 'DELIVERED' }, _sum: { total: true } }))._sum.total,
  };
  console.log('✅ Готово:', totals);
  console.log('   Вход (код 0000): админ +992900000001, кассир +992900000009, оператор +992900000002');
  console.log('   Курьеры: +992900000003..007. Админ-код регистрации: ADMIN_REGISTER_CODE из .env');
  void admin;
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(async () => { await prisma.$disconnect(); });
