/** Подсчёт статистики для админ-дашборда. */
import { Prisma } from '@prisma/client';
import { DashboardStats, OrderStatus, ProductType } from '@obi/shared';
import { prisma } from '../lib/prisma';

const dec = (d: Prisma.Decimal | number): number => (typeof d === 'number' ? d : Number(d));
const dayKey = (d: Date) => d.toISOString().slice(0, 10);

/** Преобразует пресет периода или явные даты в диапазон [from, to]. */
export function resolveRange(input: { from?: string; to?: string; period?: string }): {
  from: Date;
  to: Date;
} {
  const to = input.to ? new Date(input.to) : new Date();
  if (input.from) return { from: new Date(input.from), to };

  const from = new Date(to);
  switch (input.period) {
    case 'day':
      from.setHours(0, 0, 0, 0);
      break;
    case 'week':
      from.setDate(from.getDate() - 7);
      break;
    case 'year':
      from.setFullYear(from.getFullYear() - 1);
      break;
    case 'month':
    default:
      from.setDate(from.getDate() - 30);
      break;
  }
  return { from, to };
}

export async function getDashboard(range: { from: Date; to: Date }): Promise<DashboardStats> {
  const { from, to } = range;
  const createdInRange = { gte: from, lte: to };

  // Новые клиенты за период
  const newClients = await prisma.user.count({
    where: { role: 'CLIENT', createdAt: createdInRange },
  });

  // Все заказы за период (для общего количества и таймсерии по созданию)
  const ordersInRange = await prisma.order.findMany({
    where: { createdAt: createdInRange },
    select: { id: true, createdAt: true, status: true },
  });
  const totalOrders = ordersInRange.length;

  // Доставленные заказы за период (по дате доставки) — для выручки и продаж
  const delivered = await prisma.order.findMany({
    where: { status: OrderStatus.DELIVERED, deliveredAt: createdInRange },
    include: {
      items: { include: { product: true } },
      courier: { include: { courierProfile: true } },
    },
  });

  const deliveredOrders = delivered.length;
  let revenue = 0;

  // Таймсерия по дням: количество заказов (по созданию) + выручка (по доставке)
  const series = new Map<string, { ordersCount: number; revenue: number }>();
  for (const o of ordersInRange) {
    const k = dayKey(o.createdAt);
    const cur = series.get(k) ?? { ordersCount: 0, revenue: 0 };
    cur.ordersCount += 1;
    series.set(k, cur);
  }

  // Продажи по товарам + топ-доставщики
  const productMap = new Map<
    string,
    { productId: string; productName: string; type: ProductType; quantity: number; revenue: number }
  >();
  const courierMap = new Map<
    string,
    { courierId: string; courierName: string; deliveriesCount: number; revenue: number; rating: number }
  >();

  for (const o of delivered) {
    const orderRevenue = dec(o.total);
    revenue += orderRevenue;

    const k = dayKey(o.deliveredAt ?? o.createdAt);
    const cur = series.get(k) ?? { ordersCount: 0, revenue: 0 };
    cur.revenue += orderRevenue;
    series.set(k, cur);

    for (const it of o.items) {
      const p = productMap.get(it.productId) ?? {
        productId: it.productId,
        productName: it.product.name,
        type: it.product.type as ProductType,
        quantity: 0,
        revenue: 0,
      };
      p.quantity += it.quantity;
      p.revenue += dec(it.unitPrice) * it.quantity;
      productMap.set(it.productId, p);
    }

    if (o.courierId && o.courier) {
      const c = courierMap.get(o.courierId) ?? {
        courierId: o.courierId,
        courierName: o.courier.name ?? 'Доставщик',
        deliveriesCount: 0,
        revenue: 0,
        rating: o.courier.courierProfile?.ratingCache ?? 0,
      };
      c.deliveriesCount += 1;
      c.revenue += orderRevenue;
      courierMap.set(o.courierId, c);
    }
  }

  const timeseries = Array.from(series.entries())
    .map(([date, v]) => ({ date, ordersCount: v.ordersCount, revenue: Math.round(v.revenue * 100) / 100 }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const productSales = Array.from(productMap.values()).sort((a, b) => b.quantity - a.quantity);
  const topCouriers = Array.from(courierMap.values()).sort((a, b) => b.deliveriesCount - a.deliveriesCount);

  return {
    periodFrom: from.toISOString(),
    periodTo: to.toISOString(),
    newClients,
    totalOrders,
    deliveredOrders,
    revenue: Math.round(revenue * 100) / 100,
    timeseries,
    productSales,
    topCouriers,
  };
}
