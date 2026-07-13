/**
 * Перечисления, общие для backend и mobile.
 * Значения совпадают со схемой Prisma (enum в БД).
 */

export enum UserRole {
  CLIENT = 'CLIENT',
  COURIER = 'COURIER',
  OPERATOR = 'OPERATOR',
  ADMIN = 'ADMIN',
  CASHIER = 'CASHIER',
}

/**
 * Жизненный цикл заказа:
 * NEW       — создан, ещё никем не взят (виден всем доставщикам)
 * TAKEN     — доставщик нажал «Взять» (закреплён за ним)
 * ACCEPTED  — доставщик подтвердил («Принял»)
 * ON_WAY    — доставщик в пути
 * DELIVERED — доставлено (закрыт, уходит в историю и статистику)
 * CANCELLED — отменён
 */
export enum OrderStatus {
  NEW = 'NEW',
  TAKEN = 'TAKEN',
  ACCEPTED = 'ACCEPTED',
  ON_WAY = 'ON_WAY',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

/**
 * Тип товара. Каталог расширяется из админки — это лишь грубая категоризация
 * для статистики и фильтров. Новые товары можно добавлять с типом OTHER.
 */
export enum ProductType {
  WATER_20L = 'WATER_20L',
  WATER_05L = 'WATER_05L',
  COOLER = 'COOLER',
  PUMP_MANUAL = 'PUMP_MANUAL',
  PUMP_ELECTRIC = 'PUMP_ELECTRIC',
  OTHER = 'OTHER',
}

/** Активные статусы заказа (ещё не закрыт). */
export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.NEW,
  OrderStatus.TAKEN,
  OrderStatus.ACCEPTED,
  OrderStatus.ON_WAY,
];

/** Допустимые переходы статусов заказа доставщиком. */
export const COURIER_STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.NEW]: [OrderStatus.TAKEN],
  [OrderStatus.TAKEN]: [OrderStatus.ACCEPTED, OrderStatus.CANCELLED],
  [OrderStatus.ACCEPTED]: [OrderStatus.ON_WAY, OrderStatus.CANCELLED],
  [OrderStatus.ON_WAY]: [OrderStatus.DELIVERED, OrderStatus.CANCELLED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};
