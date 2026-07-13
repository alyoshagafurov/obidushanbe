/**
 * Защищённое хранилище токенов. Используем expo-secure-store (Keychain/Keystore),
 * НЕ AsyncStorage — токены не должны лежать в открытом хранилище.
 */
import * as SecureStore from 'expo-secure-store';

const ACCESS_KEY = 'obi_access_token';
const REFRESH_KEY = 'obi_refresh_token';

export const tokenStore = {
  async getAccess() {
    return SecureStore.getItemAsync(ACCESS_KEY);
  },
  async getRefresh() {
    return SecureStore.getItemAsync(REFRESH_KEY);
  },
  async set(access: string, refresh: string) {
    await SecureStore.setItemAsync(ACCESS_KEY, access);
    await SecureStore.setItemAsync(REFRESH_KEY, refresh);
  },
  async setAccess(access: string) {
    await SecureStore.setItemAsync(ACCESS_KEY, access);
  },
  async clear() {
    await SecureStore.deleteItemAsync(ACCESS_KEY);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
  },
};
