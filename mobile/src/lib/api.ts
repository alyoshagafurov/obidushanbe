/**
 * HTTP-клиент (axios) с:
 *  - подстановкой access-токена в заголовок;
 *  - автоматическим обновлением токена по refresh при 401 (один раз, с очередью);
 *  - аккуратной обработкой ошибок (нормализуем сообщение с бэкенда).
 */
import axios, { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { config } from '../config';
import { tokenStore } from './secureStore';

export const api = axios.create({
  baseURL: `${config.apiUrl}/api`,
  timeout: 15000,
});

// Колбэк, который вызывается при невозможности обновить сессию (разлогин).
let onAuthFailure: (() => void) | null = null;
export function setAuthFailureHandler(fn: () => void) {
  onAuthFailure = fn;
}

api.interceptors.request.use(async (cfg: InternalAxiosRequestConfig) => {
  const token = await tokenStore.getAccess();
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// --- Обновление токена (single-flight) ---
let refreshing: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = await tokenStore.getRefresh();
  if (!refreshToken) return null;
  try {
    const res = await axios.post(`${config.apiUrl}/api/auth/refresh`, { refreshToken });
    const { accessToken, refreshToken: newRefresh } = res.data;
    await tokenStore.set(accessToken, newRefresh ?? refreshToken);
    return accessToken;
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
      if (!refreshing) refreshing = refreshAccessToken();
      const newToken = await refreshing;
      refreshing = null;

      if (newToken) {
        original.headers = { ...original.headers, Authorization: `Bearer ${newToken}` };
        return api.request(original);
      }
      await tokenStore.clear();
      onAuthFailure?.();
    }
    return Promise.reject(error);
  },
);

/** Достаёт человекочитаемое сообщение об ошибке с бэкенда. */
export function apiErrorMessage(e: unknown, fallback = 'Что-то пошло не так'): string {
  const err = e as AxiosError<{ error?: { message?: string } }>;
  return err.response?.data?.error?.message ?? err.message ?? fallback;
}
