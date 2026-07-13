import { ReviewDto } from '@obi/shared';
import { api } from '../lib/api';

export async function createReview(input: {
  orderId: string;
  rating: number;
  text?: string;
}): Promise<ReviewDto> {
  const { data } = await api.post('/reviews', input);
  return data;
}
