import { Product } from '@obi/shared';
import { api } from '../lib/api';

export async function getProducts(): Promise<Product[]> {
  const { data } = await api.get('/products');
  return data;
}
