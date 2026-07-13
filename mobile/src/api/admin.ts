import { DashboardStats, OrderDto, Product, ProductType, ReviewDto } from '@obi/shared';
import { api } from '../lib/api';

export interface AdminCourier {
  id: string;
  name: string;
  phone: string;
  photoUrl: string | null;
  bio: string | null;
  rating: number;
  reviewsCount: number;
  deliveriesCount: number;
  isActive: boolean;
  territory: unknown | null;
}

export interface AdminOperator {
  id: string;
  name: string | null;
  phone: string;
  isActive: boolean;
}

export interface AdminReview extends ReviewDto {
  courierId: string;
  courierName: string;
}

// --- Статистика ---
export async function getStats(params: {
  period?: 'day' | 'week' | 'month' | 'year';
  from?: string;
  to?: string;
}): Promise<DashboardStats> {
  const { data } = await api.get('/admin/stats', { params });
  return data;
}

// --- Товары ---
export async function getAllProducts(): Promise<Product[]> {
  const { data } = await api.get('/admin/products');
  return data;
}

export async function createProduct(input: {
  name: string;
  type: ProductType;
  price: number;
  photoUrl?: string | null;
  isActive?: boolean;
  sortOrder?: number;
}): Promise<Product> {
  const { data } = await api.post('/admin/products', input);
  return data;
}

export async function updateProduct(id: string, input: Partial<Omit<Product, 'id'>>): Promise<Product> {
  const { data } = await api.patch(`/admin/products/${id}`, input);
  return data;
}

export async function deleteProduct(id: string): Promise<void> {
  await api.delete(`/admin/products/${id}`);
}

// --- Сотрудники ---
export async function getCouriers(): Promise<AdminCourier[]> {
  const { data } = await api.get('/admin/couriers');
  return data;
}

export async function getOperators(): Promise<AdminOperator[]> {
  const { data } = await api.get('/admin/operators');
  return data;
}

export async function getCashiers(): Promise<AdminOperator[]> {
  const { data } = await api.get('/admin/cashiers');
  return data;
}

export async function createStaff(input: {
  phone: string;
  name: string;
  role: 'COURIER' | 'OPERATOR' | 'CASHIER';
  bio?: string;
}): Promise<{ id: string }> {
  const { data } = await api.post('/admin/staff', input);
  return data;
}

export async function updateCourier(
  id: string,
  input: { name?: string; bio?: string | null; isActive?: boolean; territory?: unknown },
): Promise<AdminCourier> {
  const { data } = await api.patch(`/admin/couriers/${id}`, input);
  return data;
}

export async function setStaffActive(id: string, isActive: boolean): Promise<void> {
  await api.patch(`/admin/staff/${id}/active`, { isActive });
}

// --- Заказы ---
export async function getAdminOrders(params: {
  status?: string;
  courierId?: string;
  from?: string;
  to?: string;
}): Promise<OrderDto[]> {
  const { data } = await api.get('/admin/orders', { params });
  return data;
}

export async function reassignOrder(id: string, courierId: string | null): Promise<OrderDto> {
  const { data } = await api.post(`/admin/orders/${id}/reassign`, { courierId });
  return data;
}

// --- Отзывы ---
export async function getAdminReviews(): Promise<AdminReview[]> {
  const { data } = await api.get('/admin/reviews');
  return data;
}
