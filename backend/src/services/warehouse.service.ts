/**
 * Складской отчёт кассира — обмен тары.
 *
 * Модель: доставщик берёт полные бутыли со склада, привозит пустые обратно.
 *  - клиент с обменом (сдал пустую) платит только за воду (WATER_PRICE);
 *  - клиент без пустой платит за воду + бутыль (WATER_PRICE + BOTTLE_PRICE).
 *
 * Расчёт:
 *  fullSold    = fullTaken − fullReturned        (продано полных бутылей воды)
 *  bottlesSold = fullSold − emptyReturned         (новые бутыли — без обмена)
 *  total       = fullSold*water + bottlesSold*bottle   (деньги «к сдаче»)
 */
import { Prisma } from '@prisma/client';
import {
  BOTTLE_PRICE,
  UserRole,
  WATER_PRICE,
  WarehouseDaySummary,
  WarehouseReportDto,
} from '@obi/shared';
import { prisma } from '../lib/prisma';
import { BadRequest, NotFound } from '../lib/errors';

const dec = (d: Prisma.Decimal | number): number => (typeof d === 'number' ? d : Number(d));

function dayRange(dateStr?: string): { start: Date; end: Date } {
  const base = dateStr ? new Date(dateStr) : new Date();
  const start = new Date(Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), base.getUTCDate()));
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

type ReportRow = Prisma.WarehouseReportGetPayload<{ include: { courier: true } }>;

/** Считает производные величины отчёта. */
export function computeReport(r: {
  fullTaken: number;
  emptyReturned: number;
  fullReturned: number;
  waterPrice: number;
  bottlePrice: number;
}) {
  const fullSold = Math.max(0, r.fullTaken - r.fullReturned);
  const bottlesSold = Math.max(0, fullSold - r.emptyReturned);
  const waterRevenue = fullSold * r.waterPrice;
  const bottleRevenue = bottlesSold * r.bottlePrice;
  return {
    fullSold,
    bottlesSold,
    waterRevenue: Math.round(waterRevenue * 100) / 100,
    bottleRevenue: Math.round(bottleRevenue * 100) / 100,
    total: Math.round((waterRevenue + bottleRevenue) * 100) / 100,
  };
}

function toDto(r: ReportRow): WarehouseReportDto {
  const waterPrice = dec(r.waterPrice);
  const bottlePrice = dec(r.bottlePrice);
  const c = computeReport({
    fullTaken: r.fullTaken,
    emptyReturned: r.emptyReturned,
    fullReturned: r.fullReturned,
    waterPrice,
    bottlePrice,
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
    note: r.note,
    createdAt: r.createdAt.toISOString(),
    ...c,
  };
}

/** Создать отчёт по доставщику. */
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
  },
): Promise<WarehouseReportDto> {
  if (input.fullTaken < 0 || input.emptyReturned < 0) throw BadRequest('Отрицательные значения недопустимы');
  const courier = await prisma.user.findFirst({ where: { id: input.courierId, role: UserRole.COURIER } });
  if (!courier) throw NotFound('Доставщик не найден');

  const report = await prisma.warehouseReport.create({
    data: {
      courierId: input.courierId,
      cashierId,
      fullTaken: input.fullTaken,
      emptyReturned: input.emptyReturned,
      fullReturned: input.fullReturned ?? 0,
      waterPrice: new Prisma.Decimal(input.waterPrice ?? WATER_PRICE),
      bottlePrice: new Prisma.Decimal(input.bottlePrice ?? BOTTLE_PRICE),
      note: input.note ?? null,
    },
    include: { courier: true },
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
    include: { courier: true },
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
    total: Math.round(reports.reduce((s, r) => s + r.total, 0) * 100) / 100,
  };
  return { reports, summary };
}

/** Удалить отчёт (исправление ошибки ввода). */
export async function deleteReport(id: string): Promise<void> {
  await prisma.warehouseReport.deleteMany({ where: { id } });
}
