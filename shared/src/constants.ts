/** Общие константы, разделяемые backend и mobile. */

/** Срок жизни SMS-кода в минутах. */
export const SMS_CODE_TTL_MINUTES = 5;

/** Максимум попыток ввода SMS-кода до блокировки. */
export const SMS_CODE_MAX_ATTEMPTS = 5;

/** Фиктивный код в dev-режиме (когда SMS-провайдер не подключён). */
export const DEV_SMS_CODE = '0000';

/** Длина SMS-кода. */
export const SMS_CODE_LENGTH = 4;

/** Валюта (для отображения). */
export const CURRENCY = 'TJS';
export const CURRENCY_SYMBOL = 'смн';

/**
 * Модель обмена тары (для складского отчёта кассира):
 *  - клиент с обменом (сдал пустую, взял полную) платит только за воду — WATER_PRICE;
 *  - клиент без пустой платит за воду + бутыль (тару) — WATER_PRICE + BOTTLE_PRICE;
 *  - доставка бесплатная.
 * Значения по умолчанию (можно переопределить в отчёте).
 */
export const WATER_PRICE = 15; // цена воды (обмен), сомони
export const BOTTLE_PRICE = 50; // цена бутыли/тары, сомони

/** Центр Душанбе — дефолтная точка карты, если геолокация недоступна. */
export const DUSHANBE_CENTER = { lat: 38.5598, lng: 68.787 };

/** Простейшая телефонная маска Таджикистана: +992 XX XXX XX XX. */
export const PHONE_REGEX = /^\+992\d{9}$/;
