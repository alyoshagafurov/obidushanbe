import { AddressSnapshot, OrderDto, OrderStatus } from '@obi/shared';
import { api } from '../lib/api';

export interface CreateOrderPayload {
  items: { productId: string; quantity: number }[];
  address: AddressSnapshot;
}

// --- Клиент ---
export async function createOrder(payload: CreateOrderPayload): Promise<OrderDto> {
  const { data } = await api.post('/orders', payload);
  return data;
}

export async function getMyOrders(): Promise<OrderDto[]> {
  const { data } = await api.get('/orders/my');
  return data;
}

export async function getOrder(id: string): Promise<OrderDto> {
  const { data } = await api.get(`/orders/${id}`);
  return data;
}

// --- Доставщик ---
export async function getFeed(location?: { lat: number; lng: number }): Promise<OrderDto[]> {
  const { data } = await api.get('/orders/feed', { params: location });
  return data;
}

export async function getCourierOrders(active = true): Promise<OrderDto[]> {
  const { data } = await api.get('/orders/courier', { params: { active } });
  return data;
}

export async function takeOrder(id: string): Promise<OrderDto> {
  const { data } = await api.post(`/orders/${id}/take`);
  return data;
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<OrderDto> {
  const { data } = await api.post(`/orders/${id}/status`, { status });
  return data;
}
