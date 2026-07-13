/**
 * Локальный стейт авторизации (Zustand). Серверные данные — через React Query,
 * но текущий пользователь/токен-статус удобно держать здесь.
 */
import { create } from 'zustand';
import { MeResponse, UserRole } from '@obi/shared';
import { tokenStore } from '../lib/secureStore';
import { api } from '../lib/api';
import { disconnectSocket } from '../lib/socket';

interface AuthState {
  user: MeResponse | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  setUser: (user: MeResponse | null) => void;
  /** Сохранить токены и пользователя после входа. */
  signIn: (tokens: { accessToken: string; refreshToken: string }, user: MeResponse) => Promise<void>;
  /** Подтянуть текущего пользователя по сохранённому токену (при старте). */
  bootstrap: () => Promise<void>;
  signOut: () => Promise<void>;
  role: () => UserRole | null;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  status: 'loading',

  setUser: (user) => set({ user }),

  signIn: async (tokens, user) => {
    await tokenStore.set(tokens.accessToken, tokens.refreshToken);
    set({ user, status: 'authenticated' });
  },

  bootstrap: async () => {
    const token = await tokenStore.getAccess();
    if (!token) {
      set({ status: 'unauthenticated', user: null });
      return;
    }
    try {
      const { data } = await api.get<MeResponse>('/users/me');
      set({ user: data, status: 'authenticated' });
    } catch {
      await tokenStore.clear();
      set({ status: 'unauthenticated', user: null });
    }
  },

  signOut: async () => {
    await tokenStore.clear();
    disconnectSocket();
    set({ user: null, status: 'unauthenticated' });
  },

  role: () => get().user?.role ?? null,
}));
