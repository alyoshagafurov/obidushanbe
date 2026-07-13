/**
 * Преобразование моделей Prisma -> DTO для API.
 * Здесь реализована МИНИМИЗАЦИЯ ДАННЫХ:
 *  - телефон доставщика клиенту не отдаётся НИКОГДА (его нет в CourierPublicProfile);
 *  - телефон клиента виден только: админу, оператору и доставщику, ВЗЯВШЕМУ заказ,
 *    а также самому клиенту.
 */
import { Prisma } from '@prisma/client';
import {
  CourierPublicProfile,
  MeResponse,
  OrderDto,
  Product as ProductDto,
  ReviewDto,
  ChatMessageDto,
  UserRole,
  ProductType,
} from '@obi/shared';

const dec = (d: Prisma.Decimal | number | null | undefined): number =>
  d == null ? 0 : typeof d === 'number' ? d : Number(d);

export const orderInclude = {
  items: { include: { product: true } },
  courier: { include: { courierProfile: true } },
  client: true,
  review: { select: { id: true } },
} satisfies Prisma.OrderInclude;

type OrderWithRelations = Prisma.OrderGetPayload<{ include: typeof orderInclude }>;

type UserWithCourier = Prisma.UserGetPayload<{ include: { courierProfile: true } }>;

export interface Viewer {
  id: string;
  role: UserRole;
}

export function toMeResponse(u: {
  id: string;
  phone: string;
  name: string | null;
  role: string; // Prisma-enum роль -> приводим к общему UserRole
  isActive: boolean;
}): MeResponse {
  return { id: u.id, phone: u.phone, name: u.name, role: u.role as UserRole, isActive: u.isActive };
}

export function toProductDto(p: Prisma.ProductGetPayload<{}>): ProductDto {
  return {
    id: p.id,
    name: p.name,
    type: p.type as ProductType,
    price: dec(p.price),
    photoUrl: p.photoUrl,
    isActive: p.isActive,
    sortOrder: p.sortOrder,
  };
}

export function toCourierPublicProfile(u: UserWithCourier): CourierPublicProfile {
  const cp = u.courierProfile;
  return {
    id: u.id,
    name: u.name ?? 'Доставщик',
    role: UserRole.COURIER,
    photoUrl: cp?.photoUrl ?? null,
    bio: cp?.bio ?? null,
    rating: cp?.ratingCache ?? 0,
    reviewsCount: cp?.reviewsCount ?? 0,
    deliveriesCount: cp?.deliveriesCount ?? 0,
  };
}

/** Может ли наблюдатель видеть телефон клиента по этому заказу. */
function canSeeClientPhone(order: OrderWithRelations, viewer: Viewer | null): boolean {
  if (!viewer) return false;
  if (viewer.role === UserRole.ADMIN || viewer.role === UserRole.OPERATOR) return true;
  if (viewer.id === order.clientId) return true; // сам клиент
  if (viewer.role === UserRole.COURIER && order.courierId === viewer.id) return true; // взял заказ
  return false;
}

export function toOrderDto(
  order: OrderWithRelations,
  viewer: Viewer | null,
  opts: { distanceKm?: number | null } = {},
): OrderDto {
  return {
    id: order.id,
    status: order.status as OrderDto['status'],
    items: order.items.map((it) => ({
      id: it.id,
      productId: it.productId,
      productName: it.product.name,
      quantity: it.quantity,
      unitPrice: dec(it.unitPrice),
    })),
    total: dec(order.total),
    address: {
      point: order.addrLat != null && order.addrLng != null ? { lat: order.addrLat, lng: order.addrLng } : null,
      text: order.addrText,
      landmark: order.addrLandmark,
    },
    clientId: order.clientId,
    clientName: order.client?.name ?? null,
    clientPhone: canSeeClientPhone(order, viewer) ? order.client?.phone ?? null : null,
    courier: order.courier ? toCourierPublicProfile(order.courier) : null,
    createdAt: order.createdAt.toISOString(),
    deliveredAt: order.deliveredAt ? order.deliveredAt.toISOString() : null,
    distanceKm: opts.distanceKm ?? null,
    reviewed: Boolean(order.review),
  };
}

export function toReviewDto(
  r: Prisma.ReviewGetPayload<{ include: { client: true } }>,
): ReviewDto {
  return {
    id: r.id,
    orderId: r.orderId,
    rating: r.rating,
    text: r.text,
    authorName: r.client?.name ?? 'Клиент',
    createdAt: r.createdAt.toISOString(),
  };
}

export function toChatMessageDto(m: Prisma.ChatMessageGetPayload<{}>): ChatMessageDto {
  return {
    id: m.id,
    orderId: m.orderId,
    senderId: m.senderId,
    recipientId: m.recipientId,
    text: m.text,
    read: m.read,
    createdAt: m.createdAt.toISOString(),
  };
}

/** Хаверсин — расстояние между точками в км (для сортировки заказов у доставщика). */
export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 10) / 10;
}
