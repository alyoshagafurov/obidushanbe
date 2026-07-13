import { MeResponse, SavedAddress } from '@obi/shared';
import { api } from '../lib/api';

export async function getMe(): Promise<MeResponse> {
  const { data } = await api.get('/users/me');
  return data;
}

export async function updateName(name: string): Promise<MeResponse> {
  const { data } = await api.patch('/users/me', { name });
  return data;
}

export async function getAddresses(): Promise<SavedAddress[]> {
  const { data } = await api.get('/users/me/addresses');
  return data;
}

export async function createAddress(input: {
  label?: string | null;
  point?: { lat: number; lng: number } | null;
  text?: string | null;
  landmark?: string | null;
}): Promise<SavedAddress> {
  const { data } = await api.post('/users/me/addresses', input);
  return data;
}

export async function deleteAddress(id: string): Promise<void> {
  await api.delete(`/users/me/addresses/${id}`);
}
