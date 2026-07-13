/** HTTP-клиент (axios) с автообновлением токена — та же логика, что в приложении. */
import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { config } from '../config';
import { tokenStore } from './storage';

export const api = axios.create({ baseURL: `${config.apiUrl}/api`, timeout: 15000 });

let onAuthFailure: (() => void) | null = null;
export const setAuthFailureHandler = (fn: () => void) => (onAuthFailure = fn);

api.interceptors.request.use((cfg: InternalAxiosRequestConfig) => {
  const token = tokenStore.getAccess();
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

let refreshing: Promise<string | null> | null = null;
async function refreshAccess(): Promise<string | null> {
  const refreshToken = tokenStore.getRefresh();
  if (!refreshToken) return null;
  try {
    const res = await axios.post(`${config.apiUrl}/api/auth/refresh`, { refreshToken });
    tokenStore.set(res.data.accessToken, res.data.refreshToken ?? refreshToken);
    return res.data.accessToken;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as (AxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (error.response?.status === 401 && original && !original._retry) {
      original._retry = true;
      if (!refreshing) refreshing = refreshAccess();
      const token = await refreshing;
      refreshing = null;
      if (token) {
        original.headers = { ...original.headers, Authorization: `Bearer ${token}` };
        return api.request(original);
      }
      tokenStore.clear();
      onAuthFailure?.();
    }
    return Promise.reject(error);
  },
);

export function apiError(e: unknown, fallback = 'Что-то пошло не так'): string {
  const err = e as AxiosError<{ error?: { message?: string } }>;
  return err.response?.data?.error?.message ?? err.message ?? fallback;
}
