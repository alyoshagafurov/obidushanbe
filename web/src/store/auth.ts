import { create } from 'zustand';
import { MeResponse } from '@obi/shared';
import { tokenStore } from '../lib/storage';
import { getMe } from '../api';
import { disconnectSocket } from '../lib/socket';

interface AuthState {
  user: MeResponse | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  setUser: (u: MeResponse | null) => void;
  signIn: (tokens: { accessToken: string; refreshToken: string }, user: MeResponse) => void;
  bootstrap: () => Promise<void>;
  signOut: () => void;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  status: 'loading',
  setUser: (user) => set({ user }),
  signIn: (tokens, user) => {
    tokenStore.set(tokens.accessToken, tokens.refreshToken);
    set({ user, status: 'authenticated' });
  },
  bootstrap: async () => {
    if (!tokenStore.getAccess()) {
      set({ status: 'unauthenticated', user: null });
      return;
    }
    try {
      const user = await getMe();
      set({ user, status: 'authenticated' });
    } catch {
      tokenStore.clear();
      set({ status: 'unauthenticated', user: null });
    }
  },
  signOut: () => {
    tokenStore.clear();
    disconnectSocket();
    set({ user: null, status: 'unauthenticated' });
  },
}));
