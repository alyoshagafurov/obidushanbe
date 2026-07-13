import { CourierPublicProfile, ReviewDto } from '@obi/shared';
import { api } from '../lib/api';

export async function getCourier(id: string): Promise<CourierPublicProfile> {
  const { data } = await api.get(`/couriers/${id}`);
  return data;
}

export async function getCourierReviews(id: string): Promise<ReviewDto[]> {
  const { data } = await api.get(`/couriers/${id}/reviews`);
  return data;
}
