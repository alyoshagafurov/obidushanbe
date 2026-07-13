/**
 * Конфигурация приложения. Значения берутся из app.json -> expo.extra,
 * но могут быть переопределены переменными окружения EXPO_PUBLIC_* при сборке.
 *
 * ЗДЕСЬ настраивается адрес API, провайдер карт и ключ карты.
 */
import Constants from 'expo-constants';

type Extra = {
  apiUrl?: string;
  mapProvider?: 'google' | '2gis' | 'yandex';
  mapApiKey?: string;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

export const config = {
  /** Базовый URL REST API. Для устройства/эмулятора замените localhost на IP машины. */
  apiUrl: process.env.EXPO_PUBLIC_API_URL ?? extra.apiUrl ?? 'http://localhost:4000',

  /** URL WebSocket — по умолчанию совпадает с apiUrl. */
  get wsUrl() {
    return process.env.EXPO_PUBLIC_WS_URL ?? this.apiUrl;
  },

  /** Провайдер карт: google (по умолчанию) | 2gis | yandex. */
  mapProvider: (process.env.EXPO_PUBLIC_MAP_PROVIDER ?? extra.mapProvider ?? 'google') as
    | 'google'
    | '2gis'
    | 'yandex',

  /** Ключ карты (для 2ГИС/Яндекс/Google web). */
  mapApiKey: process.env.EXPO_PUBLIC_MAP_API_KEY ?? extra.mapApiKey ?? '',
};
