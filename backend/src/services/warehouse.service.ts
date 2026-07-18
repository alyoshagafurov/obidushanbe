/**
 * Складской отчёт кассира — ЕДИНЫЙ источник и для денег «к сдаче», и для зарплаты.
 *
 * Модель: доставщик берёт полные бутыли 20л со склада, привозит пустые/остаток обратно.
 *  - доставлено 20л  = fullTaken − fullReturned;
 *  - с обменом (сдал пустую) — платит только за воду (waterPrice);
 *  - без пустой — платит за воду + тару (waterPrice + bottlePrice).
 *  - прочие товары (кулер/0.5л/помпа) — продано = взял − вернул, деньги = продано × цена
 *    (в зарплату НЕ входят).
 *
 * Расчёт:
 *  fullSold    = fullTaken − fullReturned              (доставлено воды 20л)
 *  bottlesSold = fullSold − emptyReturned               (новые бутыли — без обмена)
 *  total       = fullSold*water + bottlesSold*bottle + Σ(item)   (деньги «к сдаче»)
 *  salary      = fullSold * bottleRate                  (зарплата доставщику)
 */
import { Prisma } from '@prisma/client';
import {
  BOTTLE_PRICE,
  UserRole,
  WATER_PRICE,
  WarehouseDaySummary,
  WarehouseItemDto,
  WarehouseReportDto,
} from '@obi/shared';
import { prisma } from '../lib/prisma';
import { BadRequest, NotFound } from '../lib/errors';

const dec = (d: Prisma.Decimal | number): number => (typeof d === 'number' ? d : Number(d));
const round2 = (n: number): number => Math.round(n * 100) / 100;

function dayRange(dateStr?: string): { start: Date; end: Date } {
  const base = dateStr ? new Date(dateStr) : new Date();
  const start = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

type ReportRow = Prisma.WarehouseReportGetPayload<{ include: { courier: true; items: true } }>;

interface ItemInput {
  productId?: string | null;
  name: string;
  price: number;
  taken: number;
  returned?: number;
}

/** Считает производные величины отчёта (вода 20л + тара + прочие товары + зарплата). */
export function computeReport(r: {
  fullTaken: number;
  emptyReturned: number;
  fullReturned: number;
  waterPrice: number;
  bottlePrice: number;
  bottleRate: number;
  items?: { price: number; taken: number; returned: number }[];
}) {
  const fullSold = Math.max(0, r.fullTaken - r.fullReturned);
  const bottlesSold = Math.max(0, fullSold - r.emptyReturned);
  const waterRevenue = fullSold * r.waterPrice;
  const bottleRevenue = bottlesSold * r.bottlePrice;
  const itemsRevenue = (r.items ?? []).reduce(
    (s, it) => s + Math.max(0, it.taken - it.returned) * it.price,
    0,
  );
  const salary = fullSold * r.bottleRate;
  return {
    fullSold,
    bottlesSold,
    waterRevenue: round2(waterRevenue),
    bottleRevenue: round2(bottleRevenue),
    itemsRevenue: round2(itemsRevenue),
    total: round2(waterRevenue + bottleRevenue + itemsRevenue),
    salary: round2(salary),
  };
}

function itemToDto(it: {
  id: string;
  productId: string | null;
  name: string;
  price: Prisma.Decimal;
  taken: number;
  returned: number;
}): WarehouseItemDto {
  const price = dec(it.price);
  const sold = Math.max(0, it.taken - it.returned);
  return { id: it.id, productId: it.productId, name: it.name, price, taken: it.taken, returned: it.returned, sold, revenue: round2(sold * price) };
}

function toDto(r: ReportRow): WarehouseReportDto {
  const waterPrice = dec(r.waterPrice);
  const bottlePrice = dec(r.bottlePrice);
  const bottleRate = dec(r.bottleRate);
  const items = (r.items ?? []).map(itemToDto);
  const c = computeReport({
    fullTaken: r.fullTaken,
    emptyReturned: r.emptyReturned,
    fullReturned: r.fullReturned,
    waterPrice,
    bottlePrice,
    bottleRate,
    items: items.map((i) => ({ price: i.price, taken: i.taken, returned: i.returned })),
  });
  return {
    id: r.id,
    courierId: r.courierId,
    courierName: r.courier?.name ?? 'Доставщик',
    fullTaken: r.fullTaken,
    emptyReturned: r.emptyReturned,
    fullReturned: r.fullReturned,
    waterPrice,
    bottlePrice,
    bottleRate,
    note: r.note,
    items,
    createdAt: r.createdAt.toISOString(),
    ...c,
  };
}

/** Создать отчёт по доставщику (20л обмен + прочие товары). */
export async function createReport(
  cashierId: string,
  input: {
    courierId: string;
    fullTaken: number;
    emptyReturned: number;
    fullReturned?: number;
    waterPrice?: number;
    bottlePrice?: number;
    note?: string;
    items?: ItemInput[];
  },
): Promise<WarehouseReportDto> {
  if (input.fullTaken < 0 || input.emptyReturned < 0 || (input.fullReturned ?? 0) < 0) {
    throw BadRequest('Отрицательные значения недопустимы');
  }
  const courier = await prisma.user.findFirst({
    where: { id: input.courierId, role: UserRole.COURIER },
    include: { courierProfile: true },
  });
  if (!courier) throw NotFound('Доставщик не найден');

  const bottleRate = dec(courier.courierProfile?.bottleRate ?? 1.6);
  const fullSold = Math.max(0, input.fullTaken - (input.fullReturned ?? 0));
  const items = (input.items ?? []).filter((i) => (i.taken ?? 0) > 0 || (i.returned ?? 0) > 0);

  const report = await prisma.warehouseReport.create({
    data: {
      courierId: input.courierId,
      cashierId,
      fullTaken: input.fullTaken,
      emptyReturned: input.emptyReturned,
      fullReturned: input.fullReturned ?? 0,
      waterPrice: new Prisma.Decimal(input.waterPrice ?? WATER_PRICE),
      bottlePrice: new Prisma.Decimal(input.bottlePrice ?? BOTTLE_PRICE),
      bottleRate: new Prisma.Decimal(bottleRate),
      salary: new Prisma.Decimal(round2(fullSold * bottleRate)),
      note: input.note?.trim() || null,
      items: {
        create: items.map((i) => ({
          productId: i.productId ?? null,
          name: i.name,
          price: new Prisma.Decimal(i.price),
          taken: i.taken,
          returned: i.returned ?? 0,
        })),
      },
    },
    include: { courier: true, items: true },
  });
  return toDto(report);
}

/** Отчёты за день + итоги. */
export async function listReports(dateStr?: string): Promise<{
  reports: WarehouseReportDto[];
  summary: WarehouseDaySummary;
}> {
  const { start, end } = dayRange(dateStr);
  const rows = await prisma.warehouseReport.findMany({
    where: { createdAt: { gte: start, lt: end } },
    include: { courier: true, items: true },
    orderBy: { createdAt: 'desc' },
  });
  const reports = rows.map(toDto);
  const summary: WarehouseDaySummary = {
    date: start.toISOString().slice(0, 10),
    reportsCount: reports.length,
    fullTaken: reports.reduce((s, r) => s + r.fullTaken, 0),
    emptyReturned: reports.reduce((s, r) => s + r.emptyReturned, 0),
    fullSold: reports.reduce((s, r) => s + r.fullSold, 0),
    bottlesSold: reports.reduce((s, r) => s + r.bottlesSold, 0),
    total: round2(reports.reduce((s, r) => s + r.total, 0)),
    salaryTotal: round2(reports.reduce((s, r) => s + r.salary, 0)),
  };
  return { reports, summary };
}

/** Все отчёты по одному доставщику (раскрытие «Копилки» — с заметками). */
export async function listCourierReports(courierId: string, limit = 200): Promise<WarehouseReportDto[]> {
  const rows = await prisma.warehouseReport.findMany({
    where: { courierId },
    include: { courier: true, items: true },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
  return rows.map(toDto);
}

/** Удалить отчёт (исправление ошибки ввода). Позиции удалятся каскадом. */
export async function deleteReport(id: string): Promise<void> {
  await prisma.warehouseReport.deleteMany({ where: { id } });
}
