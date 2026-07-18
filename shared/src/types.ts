/**
 * DTO-типы, которыми обмениваются backend и mobile через REST/WebSocket.
 * Это «форма ответа API» — она НЕ обязательно совпадает 1:1 с моделями Prisma
 * (часть полей намеренно скрыта: минимизация данных, см. требования безопасности).
 */
import { OrderStatus, ProductType, UserRole } from './enums';

export interface GeoPoint {
  lat: number;
  lng: number;
}

/** Снимок адреса, который прикрепляется к заказу (не меняется задним числом). */
export interface AddressSnapshot {
  /** Точка на карте (геолокация / ручная установка). Может отсутствовать, если задан только текст. */
  point: GeoPoint | null;
  /** Текстовый адрес: улица, дом, квартира. Может отсутствовать, если есть точка. */
  text: string | null;
  /** Ориентир / комментарий для доставщика. Свободный текст. */
  landmark: string | null;
}

/**
 * Сохранённый адрес клиента — «плоская» форма (как в БД), в отличие от
 * AddressSnapshot (point-based), который прикрепляется к заказу.
 */
export interface SavedAddress {
  id: string;
  /** Краткое название («Дом», «Работа»). */
  label: string | null;
  lat: number | null;
  lng: number | null;
  text: string | null;
  landmark: string | null;
}

export interface PublicUser {
  id: string;
  name: string;
  role: UserRole;
}

/** Профиль доставщика, видимый клиенту. */
export interface CourierPublicProfile extends PublicUser {
  photoUrl: string | null;
  bio: string | null;
  rating: number; // средняя оценка, 0..5
  reviewsCount: number;
  deliveriesCount: number;
}

export interface Product {
  id: string;
  name: string;
  type: ProductType;
  price: number; // в сомони (TJS)
  photoUrl: string | null;
  isActive: boolean;
  sortOrder: number;
}

export interface OrderItemDto {
  id: string;
  productId: string;
  productName: string;
  quantity: number;
  /** Цена за единицу на момент заказа (фиксируется). */
  unitPrice: number;
}

export interface OrderDto {
  id: string;
  status: OrderStatus;
  items: OrderItemDto[];
  total: number;
  address: AddressSnapshot;
  /** ID клиента (нужен доставщику для чата). Не секрет — права на чат проверяет сервер. */
  clientId: string;
  /** Имя клиента — видно оператору/доставщику/админу. */
  clientName: string | null;
  /** Телефон клиента — выдаётся только доставщику взявшего заказ и оператору/админу. */
  clientPhone: string | null;
  /** Доставщик заказа (если уже взят). Телефон доставщика клиенту не отдаётся. */
  courier: CourierPublicProfile | null;
  createdAt: string; // ISO
  deliveredAt: string | null;
  /** Расстояние до точки заказа от доставщика, км (вычисляется для списка доставщика). */
  distanceKm?: number | null;
  /** Оставлен ли уже отзыв по этому заказу (для клиента). */
  reviewed?: boolean;
}

export interface ReviewDto {
  id: string;
  orderId: string;
  rating: number; // 1..5
  text: string | null;
  authorName: string;
  createdAt: string;
}

export interface ChatMessageDto {
  id: string;
  orderId: string | null;
  senderId: string;
  recipientId: string;
  text: string;
  read: boolean;
  createdAt: string;
}

/* ----------------------------- Auth ----------------------------- */

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface MeResponse {
  id: string;
  phone: string;
  name: string | null;
  role: UserRole;
  isActive: boolean;
}

export interface LoginResponse extends AuthTokens {
  user: MeResponse;
  /** true, если это первый вход и нужно запросить имя. */
  isNewUser: boolean;
}

/* ----------------------- WebSocket events ----------------------- */

/** События, которые сервер шлёт клиентам через Socket.IO. */
export enum SocketEvent {
  // заказы для доставщиков
  ORDER_NEW = 'order:new', // появился новый неназначенный заказ
  ORDER_TAKEN = 'order:taken', // заказ кем-то взят — убрать из общего списка
  ORDER_UPDATED = 'order:updated', // изменился статус/назначение
  // чат
  CHAT_MESSAGE = 'chat:message',
  CHAT_READ = 'chat:read',
  // служебное
  ERROR = 'app:error',
}

export interface OrderTakenPayload {
  orderId: string;
  courierId: string;
}

/* ----------------------- Statistics (admin) -------------------- */

export interface TimeseriesPoint {
  date: string; // YYYY-MM-DD
  ordersCount: number;
  revenue: number;
}

export interface ProductSalesStat {
  productId: string;
  productName: string;
  type: ProductType;
  quantity: number;
  revenue: number;
}

export interface CourierStat {
  courierId: string;
  courierName: string;
  deliveriesCount: number;
  revenue: number;
  rating: number;
}

export interface DashboardStats {
  periodFrom: string;
  periodTo: string;
  newClients: number;
  totalOrders: number;
  deliveredOrders: number;
  revenue: number;
  timeseries: TimeseriesPoint[];
  productSales: ProductSalesStat[];
  topCouriers: CourierStat[];
}

/* ----------------------- Кассир (зарплата) --------------------- */

/** Строка ведомости по доставщику (для кабинета кассира). */
export interface CourierPayrollRow {
  courierId: string;
  courierName: string;
  /** Ставка за одну бутыль 20л (сомони). */
  rate: number;
  /** Доставлено 20л за выбранный день (из отчётов склада). */
  deliveredToday: number;
  /** Заработано за день = сумма зарплат по отчётам за день. */
  earnedToday: number;
  /** Подсказка: сколько 20л доставлено по приложению за день (для сверки). */
  appBottlesToday: number;
  /** «Копилка»: всего заработано минус выплачено. */
  balance: number;
  /** Заработано всего (без вычета выплат). */
  totalEarned: number;
  /** Выплачено всего. */
  totalPaid: number;
}

export interface PayoutDto {
  id: string;
  courierId: string;
  amount: number;
  note: string | null;
  createdAt: string;
}

/**
 * Складской отчёт кассира (обмен тары). Кассир 2–3 раза в день фиксирует по
 * доставщику: сколько полных бутылей взял со склада и сколько пустых вернул.
 * Остальное считается автоматически.
 */
/** Строка прочего товара в отчёте (кулер / вода 0.5л / помпа). Не входит в зарплату. */
export interface WarehouseItemDto {
  id?: string;
  productId: string | null;
  name: string;
  price: number;
  /** Взял со склада. */
  taken: number;
  /** Вернул (непроданный остаток). */
  returned: number;
  /** Продано = taken − returned. */
  sold: number;
  /** Выручка = sold × price. */
  revenue: number;
}

export interface WarehouseReportDto {
  id: string;
  courierId: string;
  courierName: string;
  /** Взял полных со склада. */
  fullTaken: number;
  /** Принёс пустых обратно. */
  emptyReturned: number;
  /** Вернул полных (непроданный остаток). */
  fullReturned: number;
  waterPrice: number;
  bottlePrice: number;
  /** Ставка за 20л на момент отчёта (снимок). */
  bottleRate: number;
  /** Доставлено воды (полных бутылей клиентам) = fullTaken − fullReturned. */
  fullSold: number;
  /** Продано новых бутылей (без обмена) = fullSold − emptyReturned. */
  bottlesSold: number;
  /** Выручка за воду. */
  waterRevenue: number;
  /** Выручка за тару (бутыли). */
  bottleRevenue: number;
  /** Выручка за прочие товары (кулеры/0.5л/помпы). */
  itemsRevenue: number;
  /** Итого «к сдаче» = вода + тара + прочие товары. */
  total: number;
  /** Зарплата доставщику за этот отчёт = fullSold × bottleRate. */
  salary: number;
  /** Прочие товары. */
  items: WarehouseItemDto[];
  note: string | null;
  createdAt: string;
}

/** Итоги за день по складским отчётам. */
export interface WarehouseDaySummary {
  date: string;
  reportsCount: number;
  fullTaken: number;
  emptyReturned: number;
  fullSold: number;
  bottlesSold: number;
  /** Деньги «к сдаче» за день. */
  total: number;
  /** Зарплата всем за день. */
  salaryTotal: number;
}

/**
 * Кабинет доставщика: его собственный заработок (без приватных заметок кассира).
 */
export interface CourierEarningsDto {
  courierId: string;
  courierName: string;
  rate: number;
  balance: number;
  totalEarned: number;
  totalPaid: number;
  /** История отчётов (последние). Заметки кассира сюда НЕ попадают. */
  reports: CourierReportBrief[];
}

/** Краткий отчёт для истории доставщика (без заметок). */
export interface CourierReportBrief {
  id: string;
  createdAt: string;
  /** Доставлено 20л. */
  delivered: number;
  /** Заработано за отчёт. */
  salary: number;
  /** Прочие доставленные товары (название × продано). */
  items: { name: string; sold: number }[];
}
