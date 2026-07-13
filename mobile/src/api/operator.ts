import { AddressSnapshot, OrderDto, SavedAddress } from '@obi/shared';
import { api } from '../lib/api';

export interface ClientLookupResult {
  exists: boolean;
  id?: string;
  name?: string | null;
  addresses?: SavedAddress[];
}

export async function lookupClient(phone: string): Promise<ClientLookupResult> {
  const { data } = await api.get('/operator/clients/lookup', { params: { phone } });
  return data;
}

export async function createOperatorOrder(input: {
  clientPhone: string;
  clientName?: string;
  items: { productId: string; quantity: number }[];
  address: AddressSnapshot;
}): Promise<OrderDto> {
  const { data } = await api.post('/operator/orders', input);
  return data;
}

export async function getOperatorOrders(): Promise<OrderDto[]> {
  const { data } = await api.get('/operator/orders');
  return data;
}
