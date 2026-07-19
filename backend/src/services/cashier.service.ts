/**
 * Логика кабинета кассира (зарплата доставщиков).
 *
 * Единый источник — складские отчёты (WarehouseReport): каждый отчёт хранит
 * снимок ставки и посчитанную зарплату (fullSold × bottleRate). Здесь мы только
 * агрегируем: ведомость на день, «копилка» (всего заработано − выплачено),
 * выплаты, ставки и личный заработок доставщика.
 */
import { Prisma } from '@prisma/client';
import {
  CourierEarningsDto,
  CourierPayrollRow,
  CourierReportBrief,
  OrderStatus,
  ProductType,
  UserRole,
} from '@obi/shared';
import { prisma } from '../lib/prisma';
import { BadRequest, NotFound } from '../lib/errors';

const dec = (d: Prisma.Decimal | number | null | undefined): number =>
  d == null ? 0 : typeof d === 'number' ? d : Number(d);
const round2 = (n: number): number => Math.round(n * 100) / 100;

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

  const [earnedBy, paidBy, todayReports, deliveredToday] = await Promise.all([
    // Заработано всего = сумма зарплат по всем отчётам.
    prisma.warehouseReport.groupBy({ by: ['courierId'], _sum: { salary: true } }),
    prisma.payout.groupBy({ by: ['courierId'], _sum: { amount: true } }),
    // Отчёты за выбранный день (для «доставлено/заработано за день»).
    prisma.warehouseReport.findMany({
      where: { createdAt: range },
      select: { courierId: true, fullTaken: true, fullReturned: true, salary: true },
    }),
    // Подсказка: сколько 20л доставлено по приложению за день.
    prisma.order.findMany({
      where: { status: OrderStatus.DELIVERED, deliveredAt: range, courierId: { not: null } },
      include: { items: { include: { product: true } } },
    }),
  ]);

  const earnedMap = new Map(earnedBy.map((e) => [e.courierId, dec(e._sum.salary)]));
  const paidMap = new Map(paidBy.map((p) => [p.courierId, dec(p._sum.amount)]));

  const deliveredMap = new Map<string, number>();
  const earnedTodayMap = new Map<string, number>();
  for (const r of todayReports) {
    const delivered = Math.max(0, r.fullTaken - r.fullReturned);
    deliveredMap.set(r.courierId, (deliveredMap.get(r.courierId) ?? 0) + delivered);
    earnedTodayMap.set(r.courierId, (earnedTodayMap.get(r.courierId) ?? 0) + dec(r.salary));
  }

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
    const totalEarned = earnedMap.get(c.id) ?? 0;
    const totalPaid = paidMap.get(c.id) ?? 0;
    return {
      courierId: c.id,
      courierName: c.name ?? 'Доставщик',
      rate,
      deliveredToday: deliveredMap.get(c.id) ?? 0,
      earnedToday: round2(earnedTodayMap.get(c.id) ?? 0),
      appBottlesToday: appBottlesMap.get(c.id) ?? 0,
      balance: round2(totalEarned - totalPaid),
      totalEarned: round2(totalEarned),
      totalPaid: round2(totalPaid),
    };
  });
}

/** Зафиксировать выплату доставщику (уменьшает «копилку»). */
export async function createPayout(cashierId: string, courierId: string, amount?: number, note?: string) {
  const courier = await prisma.user.findFirst({ where: { id: courierId, role: UserRole.COURIER } });
  if (!courier) throw NotFound('Доставщик не найден');

  const [earned, paid] = await Promise.all([
    prisma.warehouseReport.aggregate({ where: { courierId }, _sum: { salary: true } }),
    prisma.payout.aggregate({ where: { courierId }, _sum: { amount: true } }),
  ]);
  const balance = dec(earned._sum.salary) - dec(paid._sum.amount);

  const payAmount = amount != null ? amount : balance;
  if (payAmount <= 0) throw BadRequest('Нечего выплачивать');
  if (payAmount > balance + 0.001) throw BadRequest('Сумма больше копилки');

  await prisma.payout.create({
    data: { courierId, cashierId, amount: new Prisma.Decimal(payAmount), note: note?.trim() || null },
  });
  return { ok: true, paid: round2(payAmount), balanceAfter: round2(balance - payAmount) };
}

/** Установить индивидуальную ставку за бутыль (прошлые отчёты не меняются — там снимок). */
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

/**
 * Личный заработок доставщика (его собственный кабинет) — БЕЗ заметок кассира.
 */
export async function courierEarnings(courierId: string): Promise<CourierEarningsDto> {
  const courier = await prisma.user.findFirst({
    where: { id: courierId, role: UserRole.COURIER },
    include: { courierProfile: true },
  });
  if (!courier) throw NotFound('Доставщик не найден');

  const [reports, earned, paid] = await Promise.all([
    prisma.warehouseReport.findMany({
      where: { courierId },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 120,
    }),
    prisma.warehouseReport.aggregate({ where: { courierId }, _sum: { salary: true } }),
    prisma.payout.aggregate({ where: { courierId }, _sum: { amount: true } }),
  ]);

  const totalEarned = dec(earned._sum.salary);
  const totalPaid = dec(paid._sum.amount);

  const brief: CourierReportBrief[] = reports.map((r) => ({
    id: r.id,
    createdAt: r.createdAt.toISOString(),
    delivered: Math.max(0, r.fullTaken - r.fullReturned),
    salary: dec(r.salary),
    items: r.items.map((it) => it.name),
  }));

  return {
    courierId: courier.id,
    courierName: courier.name ?? 'Доставщик',
    rate: dec(courier.courierProfile?.bottleRate ?? 1.6),
    balance: round2(totalEarned - totalPaid),
    totalEarned: round2(totalEarned),
    totalPaid: round2(totalPaid),
    reports: brief,
  };
}
