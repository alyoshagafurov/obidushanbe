/**
 * Бизнес-логика заказов.
 * Ключевое: takeOrder — атомарное «взятие» заказа доставщиком (защита от гонки).
 */
import { Prisma } from '@prisma/client';
import {
  AddressSnapshot,
  COURIER_STATUS_TRANSITIONS,
  OrderStatus,
} from '@obi/shared';
import { prisma } from '../lib/prisma';
import { BadRequest, Conflict, Forbidden, NotFound } from '../lib/errors';
import { securityLog } from '../lib/logger';
import { orderInclude, toOrderDto, Viewer, haversineKm } from './mappers';
import { emitOrderNew, emitOrderTaken, emitOrderUpdated } from '../realtime/socket';

export interface CreateOrderInput {
  clientId: string;
  operatorId?: string | null;
  items: { productId: string; quantity: number }[];
  address: AddressSnapshot;
}

/** Создать заказ (общий путь для клиента и оператора). */
export async function createOrder(input: CreateOrderInput) {
  if (!input.items.length) throw BadRequest('Корзина пуста');

  // Минимум: либо точка на карте, либо текстовый адрес.
  if (!input.address.point && !input.address.text?.trim()) {
    throw BadRequest('Укажите точку на карте или текстовый адрес');
  }

  const productIds = input.items.map((i) => i.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isActive: true },
  });
  const byId = new Map(products.map((p) => [p.id, p]));

  // Все товары должны существовать и быть активными.
  for (const item of input.items) {
    if (!byId.has(item.productId)) {
      throw BadRequest(`Товар недоступен: ${item.productId}`);
    }
    if (item.quantity < 1) throw BadRequest('Количество должно быть не меньше 1');
  }

  let total = new Prisma.Decimal(0);
  const itemsData = input.items.map((item) => {
    const product = byId.get(item.productId)!;
    total = total.add(product.price.mul(item.quantity));
    return { productId: product.id, quantity: item.quantity, unitPrice: product.price };
  });

  const order = await prisma.order.create({
    data: {
      clientId: input.clientId,
      operatorId: input.operatorId ?? null,
      status: OrderStatus.NEW,
      addrLat: input.address.point?.lat ?? null,
      addrLng: input.address.point?.lng ?? null,
      addrText: input.address.text ?? null,
      addrLandmark: input.address.landmark ?? null,
      total,
      items: { create: itemsData },
    },
    include: orderInclude,
  });

  const dto = toOrderDto(order, { id: input.clientId, role: 'CLIENT' as Viewer['role'] });
  emitOrderNew(dto); // мгновенно показать новый заказ всем доставщикам
  return dto;
}

/**
 * Атомарное взятие заказа доставщиком.
 * Гонка решается через compare-and-set: UPDATE ... WHERE id=? AND status='NEW'.
 * Если двое нажали одновременно, успешный UPDATE будет ровно один (count===1),
 * второй получит count===0 -> «заказ уже взят».
 */
export async function takeOrder(courierId: string, orderId: string, viewer: Viewer) {
  // Взял заказ — он сразу «В пути» (без промежуточных «Принял»/«Подтвердил»).
  const result = await prisma.order.updateMany({
    where: { id: orderId, status: OrderStatus.NEW, courierId: null },
    data: { status: OrderStatus.ON_WAY, courierId, takenAt: new Date() },
  });

  if (result.count === 0) {
    // Различаем «нет такого заказа» и «уже взят».
    const existing = await prisma.order.findUnique({ where: { id: orderId } });
    if (!existing) throw NotFound('Заказ не найден');
    await securityLog({
      event: 'ORDER_RACE_LOST',
      userId: courierId,
      meta: { orderId, currentStatus: existing.status },
    });
    throw Conflict('Заказ уже взят другим доставщиком');
  }

  const order = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: orderInclude });
  emitOrderTaken({ orderId, courierId }, order.clientId);
  emitOrderUpdated(toOrderDto(order, viewer), [order.clientId, courierId]);
  return toOrderDto(order, viewer);
}

/** Смена статуса доставщиком: Принял -> В пути -> Доставлено (или Отмена). */
export async function updateOrderStatus(
  courierId: string,
  orderId: string,
  nextStatus: OrderStatus,
  viewer: Viewer,
) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw NotFound('Заказ не найден');
  if (order.courierId !== courierId) throw Forbidden('Это не ваш заказ');

  const allowed = COURIER_STATUS_TRANSITIONS[order.status as OrderStatus] ?? [];
  if (!allowed.includes(nextStatus)) {
    throw BadRequest(`Недопустимый переход статуса: ${order.status} -> ${nextStatus}`);
  }

  const data: Prisma.OrderUpdateInput = { status: nextStatus };
  if (nextStatus === OrderStatus.DELIVERED) data.deliveredAt = new Date();
  if (nextStatus === OrderStatus.CANCELLED) data.cancelledAt = new Date();

  await prisma.order.update({ where: { id: orderId }, data });

  // При доставке — увеличиваем счётчик доставок доставщика.
  if (nextStatus === OrderStatus.DELIVERED) {
    await prisma.courierProfile.updateMany({
      where: { userId: courierId },
      data: { deliveriesCount: { increment: 1 } },
    });
  }

  const updated = await prisma.order.findUniqueOrThrow({ where: { id: orderId }, include: orderInclude });
  const dto = toOrderDto(updated, viewer);
  emitOrderUpdated(dto, [updated.clientId, courierId]);
  return dto;
}

/** Список новых (неназначенных) заказов для доставщика, с расстоянием от его позиции. */
export async function listNewOrders(viewer: Viewer, courierLocation?: { lat: number; lng: number }) {
  const orders = await prisma.order.findMany({
    where: { status: OrderStatus.NEW },
    include: orderInclude,
    orderBy: { createdAt: 'asc' },
  });
  return orders.map((o) => {
    let distanceKm: number | null = null;
    if (courierLocation && o.addrLat != null && o.addrLng != null) {
      distanceKm = haversineKm(courierLocation, { lat: o.addrLat, lng: o.addrLng });
    }
    return toOrderDto(o, viewer, { distanceKm });
  });
}

/** Активные заказы конкретного доставщика. */
export async function listCourierOrders(courierId: string, viewer: Viewer, onlyActive = true) {
  const orders = await prisma.order.findMany({
    where: {
      courierId,
      ...(onlyActive
        ? { status: { in: [OrderStatus.TAKEN, OrderStatus.ACCEPTED, OrderStatus.ON_WAY] } }
        : {}),
    },
    include: orderInclude,
    orderBy: { takenAt: 'desc' },
  });
  return orders.map((o) => toOrderDto(o, viewer));
}

/** Заказы клиента (текущие + история). */
export async function listClientOrders(clientId: string, viewer: Viewer) {
  const orders = await prisma.order.findMany({
    where: { clientId },
    include: orderInclude,
    orderBy: { createdAt: 'desc' },
  });
  return orders.map((o) => toOrderDto(o, viewer));
}

/** Получить один заказ с проверкой, что наблюдатель имеет к нему отношение. */
export async function getOrderForViewer(orderId: string, viewer: Viewer) {
  const order = await prisma.order.findUnique({ where: { id: orderId }, include: orderInclude });
  if (!order) throw NotFound('Заказ не найден');

  const isParticipant =
    order.clientId === viewer.id ||
    order.courierId === viewer.id ||
    order.operatorId === viewer.id ||
    viewer.role === 'ADMIN' ||
    viewer.role === 'OPERATOR';
  if (!isParticipant) throw Forbidden('Нет доступа к заказу');

  return toOrderDto(order, viewer);
}

/** Пересчёт кэша рейтинга доставщика (после нового отзыва). */
export async function recomputeCourierRating(courierId: string) {
  const agg = await prisma.review.aggregate({
    where: { courierId },
    _avg: { rating: true },
    _count: { rating: true },
  });
  await prisma.courierProfile.updateMany({
    where: { userId: courierId },
    data: {
      ratingCache: agg._avg.rating ?? 0,
      reviewsCount: agg._count.rating,
    },
  });
}
