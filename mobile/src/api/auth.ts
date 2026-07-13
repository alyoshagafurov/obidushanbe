import { LoginResponse, MeResponse, UserRole } from '@obi/shared';
import { api } from '../lib/api';

export async function requestCode(phone: string): Promise<{ ok: boolean; devCode?: string }> {
  const { data } = await api.post('/auth/request-code', { phone });
  return data;
}

export async function verifyCode(phone: string, code: string): Promise<LoginResponse> {
  const { data } = await api.post<LoginResponse>('/auth/verify', { phone, code });
  return data;
}

export async function completeRegistration(input: {
  name: string;
  role: UserRole;
  adminCode?: string;
}): Promise<MeResponse> {
  const { data } = await api.post<MeResponse>('/auth/complete-registration', input);
  return data;
}
