/**
 * Дневной складской отчёт кассира (как строка в тетради).
 * ОДИН отчёт на доставщика в день; внутри — рейсы (заезды на склад).
 *
 * Каждый рейс: взял (taken), принёс пустых (emptyReturned), вернул полных (fullReturned).
 * Доставлено рейса   = взял − вернул полных;
 * с бочкой рейса     = доставлено − пустых (клиент не вернул пустую).
 * По дню суммируем рейсы; за воду платят все доставленные, за бочку — только «с бочкой».
 *
 *  delivered  = Σ (taken − fullReturned)
 *  soldBottle = Σ max(0, deliveredTrip − emptyReturned)
 *  total      = delivered*water + soldBottle*bottle + Σ(«Ещё»)   (деньги «к сдаче»)
 *  salary     = delivered * bottleRate                           (зарплата)
 */
import { Prisma } from '@prisma/client';
import {
  BOTTLE_PRICE,
  UserRole,
  WATER_PRICE,
  WarehouseDaySummary,
  WarehouseItemDto,
  WarehouseReportDto,
  WarehouseTripDto,
} from '@obi/shared';
import { prisma } from '../lib/prisma';
import { BadRequest, NotFound } from '../lib/errors';

const dec = (d: Prisma.Decimal | number): number => (typeof d === 'number' ? d : Number(d));
const round2 = (n: number): number => Math.round(n * 100) / 100;

/** Нормализуем дату (YYYY-MM-DD/ISO) к UTC-полуночи — ключ дня. */
function normalizeDay(dateStr?: string): Date {
  const base = dateStr ? new Date(dateStr) : new Date();
  return new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()));
}

type ReportRow = Prisma.WarehouseReportGetPayload<{ include: { courier: true; trips: true; items: true } }>;

interface TripInput {
  taken: number;
  emptyReturned?: number;
  fullReturned?: number;
}
interface ItemInput {
  name: string;
  amount: number;
}

/** Производные величины по рейсам + «Ещё». */
export function computeReport(
  trips: { taken: number; emptyReturned: number; fullReturned: number }[],
  opts: { waterPrice: number; bottlePrice: number; bottleRate: number; items?: { amount: number }[] },
) {
  let fullTaken = 0, emptyReturned = 0, fullReturned = 0, fullSold = 0, bottlesSold = 0;
  for (const t of trips) {
    const deliveredTrip = Math.max(0, t.taken - t.fullReturned);
    fullTaken += t.taken;
    emptyReturned += t.emptyReturned;
    fullReturned += t.fullReturned;
    fullSold += deliveredTrip;
    bottlesSold += Math.max(0, deliveredTrip - t.emptyReturned);
  }
  const itemsRevenue = (opts.items ?? []).reduce((s, it) => s + it.amount, 0);
  const waterRevenue = fullSold * opts.waterPrice;
  const bottleRevenue = bottlesSold * opts.bottlePrice;
  const salary = fullSold * opts.bottleRate;
  return {
    fullTaken,
    emptyReturned,
    fullReturned,
    fullSold,
    bottlesSold,
    waterRevenue: round2(waterRevenue),
    bottleRevenue: round2(bottleRevenue),
    itemsRevenue: round2(itemsRevenue),
    total: round2(waterRevenue + bottleRevenue + itemsRevenue),
    salary: round2(salary),
  };
}

function itemToDto(it: { id: string; name: string; amount: Prisma.Decimal }): WarehouseItemDto {
  return { id: it.id, name: it.name, amount: dec(it.amount) };
}

function toDto(r: ReportRow): WarehouseReportDto {
  const waterPrice = dec(r.waterPrice);
  const bottlePrice = dec(r.bottlePrice);
  const bottleRate = dec(r.bottleRate);
  const trips: WarehouseTripDto[] = [...r.trips]
    .sort((a, b) => a.seq - b.seq)
    .map((t) => ({ taken: t.taken, emptyReturned: t.emptyReturned, fullReturned: t.fullReturned }));
  const items = (r.items ?? []).map(itemToDto);
  const c = computeReport(trips, { waterPrice, bottlePrice, bottleRate, items: items.map((i) => ({ amount: i.amount })) });
  return {
    id: r.id,
    courierId: r.courierId,
    courierName: r.courier?.name ?? 'Доставщик',
    date: r.date.toISOString().slice(0, 10),
    trips,
    waterPrice,
    bottlePrice,
    bottleRate,
    note: r.note,
    items,
    createdAt: r.createdAt.toISOString(),
    ...c,
  };
}

/**
 * Сохранить дневной отчёт доставщика (upsert по courierId+день).
 * Полностью заменяет рейсы и «Ещё» переданными.
 */
export async function saveReport(
  cashierId: string,
  input: {
    courierId: string;
    date?: string;
    trips: TripInput[];
    note?: string;
    items?: ItemInput[];
  },
): Promise<WarehouseReportDto> {
  const courier = await prisma.user.findFirst({
    where: { id: input.courierId, role: UserRole.COURIER },
    include: { courierProfile: true },
  });
  if (!courier) throw NotFound('Доставщик не найден');

  const day = normalizeDay(input.date);
  const bottleRate = dec(courier.courierProfile?.bottleRate ?? 1.6);

  const trips = (input.trips ?? [])
    .map((t) => ({
      taken: Math.max(0, Math.trunc(t.taken || 0)),
      emptyReturned: Math.max(0, Math.trunc(t.emptyReturned ?? 0)),
      fullReturned: Math.max(0, Math.trunc(t.fullReturned ?? 0)),
    }))
    .filter((t) => t.taken > 0 || t.emptyReturned > 0 || t.fullReturned > 0);

  const items = (input.items ?? []).filter((i) => i.name?.trim() && i.amount > 0);
  const c = computeReport(trips, { waterPrice: WATER_PRICE, bottlePrice: BOTTLE_PRICE, bottleRate });

  const data = {
    cashierId,
    waterPrice: new Prisma.Decimal(WATER_PRICE),
    bottlePrice: new Prisma.Decimal(BOTTLE_PRICE),
    bottleRate: new Prisma.Decimal(bottleRate),
    salary: new Prisma.Decimal(c.salary),
    note: input.note?.trim() || null,
    trips: { create: trips.map((t, i) => ({ seq: i + 1, taken: t.taken, emptyReturned: t.emptyReturned, fullReturned: t.fullReturned })) },
    items: { create: items.map((i) => ({ name: i.name.trim(), amount: new Prisma.Decimal(i.amount) })) },
  };

  const existing = await prisma.warehouseReport.findUnique({ where: { courierId_date: { courierId: input.courierId, date: day } } });
  if (existing) {
    await prisma.$transaction([
      prisma.warehouseTrip.deleteMany({ where: { reportId: existing.id } }),
      prisma.warehouseReportItem.deleteMany({ where: { reportId: existing.id } }),
      prisma.warehouseReport.update({ where: { id: existing.id }, data }),
    ]);
  } else {
    await prisma.warehouseReport.create({ data: { courierId: input.courierId, date: day, ...data } });
  }

  const saved = await prisma.warehouseReport.findUnique({
    where: { courierId_date: { courierId: input.courierId, date: day } },
    include: { courier: true, trips: true, items: true },
  });
  return toDto(saved!);
}

/** Отчёты за день + итоги. */
export async function listReports(dateStr?: string): Promise<{
  reports: WarehouseReportDto[];
  summary: WarehouseDaySummary;
}> {
  const day = normalizeDay(dateStr);
  const rows = await prisma.warehouseReport.findMany({
    where: { date: day },
    include: { courier: true, trips: true, items: true },
    orderBy: { createdAt: 'asc' },
  });
  const reports = rows.map(toDto);
  const summary: WarehouseDaySummary = {
    date: day.toISOString().slice(0, 10),
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
    include: { courier: true, trips: true, items: true },
    orderBy: { date: 'desc' },
    take: limit,
  });
  return rows.map(toDto);
}

/** Удалить дневной отчёт (рейсы и «Ещё» удалятся каскадом). */
export async function deleteReport(id: string): Promise<void> {
  await prisma.warehouseReport.deleteMany({ where: { id } });
}
