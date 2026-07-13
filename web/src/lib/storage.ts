/** Хранилище токенов в браузере (localStorage). */
const ACCESS = 'obi_access';
const REFRESH = 'obi_refresh';

export const tokenStore = {
  getAccess: () => localStorage.getItem(ACCESS),
  getRefresh: () => localStorage.getItem(REFRESH),
  set(access: string, refresh: string) {
    localStorage.setItem(ACCESS, access);
    localStorage.setItem(REFRESH, refresh);
  },
  clear() {
    localStorage.removeItem(ACCESS);
    localStorage.removeItem(REFRESH);
  },
};
