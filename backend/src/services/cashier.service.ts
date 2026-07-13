/**
 * Логика кабинета кассира (зарплата доставщиков).
 *
 * Кассир каждый вечер вручную вписывает, сколько бутылей 20л доставил каждый
 * доставщик. Система считает сумму (бутыли × индивидуальная ставка) и копит
 * «копилку» (всего заработано − выплачено). Рядом показывается подсказка —
 * сколько 20л доставлено по приложению (для сверки).
 */
import { Prisma } from '@prisma/client';
import { CourierPayrollRow, OrderStatus, ProductType, UserRole } from '@obi/shared';
import { prisma } from '../lib/prisma';
import { BadRequest, NotFound } from '../lib/errors';

const dec = (d: Prisma.Decimal | number | null | undefined): number =>
  d == null ? 0 : typeof d === 'number' ? d : Number(d);

/** Нормализуем дату (YYYY-MM-DD или ISO) к UTC-полуночи — это ключ дня. */
export function normalizeDay(dateStr?: string): Date {
  const base = dateStr ? new Date(dateStr) : new Date();
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()));
}

function dayRange(day: Date): { gte: Date; lt: Date } {
  const lt = new Date(day);
  lt.setUTCDate(lt.getUTCDate() + 1);
  return { gte: day, lt };
}

/** Ведомость по всем доставщикам на выбранный день. */
export async function listPayroll(dateStr?: string): Promise<CourierPayrollRow[]> {
  const day = normalizeDay(dateStr);
  const range = dayRange(day);

  const couriers = await prisma.user.findMany({
    where: { role: UserRole.COURIER, isActive: true },
    include: { courierProfile: true },
    orderBy: { createdAt: 'asc' },
  });

  // Заработано/выплачено за всё время (по доставщикам).
  const [earnedBy, paidBy, todayEntries, deliveredToday] = await Promise.all([
    prisma.deliveryEntry.groupBy({ by: ['courierId'], _sum: { amount: true } }),
    prisma.payout.groupBy({ by: ['courierId'], _sum: { amount: true } }),
    prisma.deliveryEntry.findMany({ where: { date: day } }),
    prisma.order.findMany({
      where: { status: OrderStatus.DELIVERED, deliveredAt: range, courierId: { not: null } },
      include: { items: { include: { product: true } } },
    }),
  ]);

  const earnedMap = new Map(earnedBy.map((e) => [e.courierId, dec(e._sum.amount)]));
  const paidMap = new Map(paidBy.map((p) => [p.courierId, dec(p._sum.amount)]));
  const entryMap = new Map(todayEntries.map((e) => [e.courierId, e]));

  // Подсказка: сколько 20л доставлено по приложению за день (по доставщикам).
  const appBottlesMap = new Map<string, number>();
  for (const order of deliveredToday) {
    if (!order.courierId) continue;
    const b = order.items
      .filter((it) => it.product.type === ProductType.WATER_20L)
      .reduce((s, it) => s + it.quantity, 0);
    appBottlesMap.set(order.courierId, (appBottlesMap.get(order.courierId) ?? 0) + b);
  }

  return couriers.map((c) => {
    const rate = dec(c.courierProfile?.bottleRate ?? 1.6);
    const entry = entryMap.get(c.id);
    const bottlesToday = entry?.bottles20 ?? 0;
    const amountToday = entry ? dec(entry.amount) : 0;
    const totalEarned = earnedMap.get(c.id) ?? 0;
    const totalPaid = paidMap.get(c.id) ?? 0;
    return {
      courierId: c.id,
      courierName: c.name ?? 'Доставщик',
      rate,
      bottlesToday,
      amountToday,
      appBottlesToday: appBottlesMap.get(c.id) ?? 0,
      balance: Math.round((totalEarned - totalPaid) * 100) / 100,
      totalEarned: Math.round(totalEarned * 100) / 100,
      totalPaid: Math.round(totalPaid * 100) / 100,
      hasEntryToday: !!entry,
    };
  });
}

/** Ввод/обновление количества бутылей за день для доставщика. */
export async function upsertEntry(
  cashierId: string,
  courierId: string,
  bottles: number,
  dateStr?: string,
): Promise<CourierPayrollRow[]> {
  if (bottles < 0) throw BadRequest('Количество не может быть отрицательным');
  const courier = await prisma.user.findFirst({
    where: { id: courierId, role: UserRole.COURIER },
    include: { courierProfile: true },
  });
  if (!courier) throw NotFound('Доставщик не найден');

  const day = normalizeDay(dateStr);
  const rate = courier.courierProfile?.bottleRate ?? new Prisma.Decimal(1.6);
  const amount = rate.mul(bottles);

  await prisma.deliveryEntry.upsert({
    where: { courierId_date: { courierId, date: day } },
    create: { courierId, date: day, bottles20: bottles, rate, amount, cashierId },
    update: { bottles20: bottles, rate, amount, cashierId },
  });

  return listPayroll(dateStr);
}

/** Зафиксировать выплату доставщику (уменьшает «копилку»). */
export async function createPayout(cashierId: string, courierId: string, amount?: number, note?: string) {
  const courier = await prisma.user.findFirst({ where: { id: courierId, role: UserRole.COURIER } });
  if (!courier) throw NotFound('Доставщик не найден');

  const [earned, paid] = await Promise.all([
    prisma.deliveryEntry.aggregate({ where: { courierId }, _sum: { amount: true } }),
    prisma.payout.aggregate({ where: { courierId }, _sum: { amount: true } }),
  ]);
  const balance = dec(earned._sum.amount) - dec(paid._sum.amount);

  // По умолчанию выплачиваем всю копилку.
  const payAmount = amount != null ? amount : balance;
  if (payAmount <= 0) throw BadRequest('Нечего выплачивать');
  if (payAmount > balance + 0.001) throw BadRequest('Сумма больше копилки');

  await prisma.payout.create({
    data: { courierId, cashierId, amount: new Prisma.Decimal(payAmount), note: note ?? null },
  });
  return { ok: true, paid: Math.round(payAmount * 100) / 100, balanceAfter: Math.round((balance - payAmount) * 100) / 100 };
}

/** Установить индивидуальную ставку за бутыль (не меняет прошлые записи — там снимок). */
export async function setRate(courierId: string, rate: number) {
  if (rate < 0) throw BadRequest('Ставка не может быть отрицательной');
  const courier = await prisma.user.findFirst({ where: { id: courierId, role: UserRole.COURIER } });
  if (!courier) throw NotFound('Доставщик не найден');
  await prisma.courierProfile.upsert({
    where: { userId: courierId },
    create: { userId: courierId, bottleRate: new Prisma.Decimal(rate) },
    update: { bottleRate: new Prisma.Decimal(rate) },
  });
  return { ok: true, courierId, rate };
}

/** История выплат доставщика. */
export async function listPayouts(courierId: string) {
  const payouts = await prisma.payout.findMany({
    where: { courierId },
    orderBy: { createdAt: 'desc' },
    take: 100,
  });
  return payouts.map((p) => ({
    id: p.id,
    courierId: p.courierId,
    amount: dec(p.amount),
    note: p.note,
    createdAt: p.createdAt.toISOString(),
  }));
}
