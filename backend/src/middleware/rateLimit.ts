/**
 * Rate limiting. Особо жёсткие лимиты на вход и отправку SMS-кода
 * (защита от перебора кодов и спама SMS).
 */
import rateLimit from 'express-rate-limit';
import { isProd } from '../config/env';

const jsonMessage = (message: string) => ({
  error: { message, code: 'TOO_MANY_REQUESTS' },
});

// В dev-режиме лимиты мягкие (чтобы не мешали тестировать), в проде — строгие.
const dev = !isProd;

/** Общий лимит на все API. */
export const globalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 минута
  limit: dev ? 10000 : 120,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: jsonMessage('Слишком много запросов, попробуйте позже'),
});

/** Запрос SMS-кода: не чаще нескольких раз за окно (по IP). */
export const requestSmsLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 минут
  limit: dev ? 1000 : 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: jsonMessage('Слишком много запросов кода. Подождите и попробуйте снова'),
});

/** Проверка кода / вход: защита от перебора. */
export const verifyLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: dev ? 1000 : 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: jsonMessage('Слишком много попыток входа. Подождите и попробуйте снова'),
});
