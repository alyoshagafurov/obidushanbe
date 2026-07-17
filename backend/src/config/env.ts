/**
 * Централизованная загрузка и валидация переменных окружения.
 * Никаких секретов в коде — всё только отсюда. См. .env.example.
 */
import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(4000),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL обязателен'),

  // JWT
  JWT_ACCESS_SECRET: z.string().min(16, 'JWT_ACCESS_SECRET слишком короткий'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET слишком короткий'),
  JWT_ACCESS_TTL: z.string().default('15m'),
  JWT_REFRESH_TTL: z.string().default('30d'),

  // CORS: список разрешённых origin через запятую. В dev можно "*".
  CORS_ORIGINS: z.string().default('*'),

  // Секретный код для саморегистрации администратора. Если пусто — регистрация
  // админом через приложение запрещена.
  ADMIN_REGISTER_CODE: z.string().optional(),

  // Публичный базовый URL самого бэкенда (для локального хранилища файлов).
  // На реальном устройстве замените на http://<IP-ПК>:4000.
  BACKEND_PUBLIC_URL: z.string().default('http://localhost:4000'),

  // Демо-режим: SMS-код всегда "0000" и возвращается в ответе (для показа на
  // боевом сайте без реального SMS-провайдера). Задать DEMO_MODE=true в .env.
  // ВНИМАНИЕ: для настоящего запуска выключить и подключить SMS-провайдера.
  DEMO_MODE: z.string().optional(),

  // SMS-провайдер: dev | <будущие провайдеры>
  SMS_PROVIDER: z.enum(['dev', 'osonsms', 'twilio']).default('dev'),
  SMS_API_KEY: z.string().optional(),
  SMS_API_URL: z.string().optional(),
  SMS_SENDER: z.string().optional(),

  // Хранилище файлов: local | s3 (R2 — это s3-совместимый)
  STORAGE_PROVIDER: z.enum(['local', 's3']).default('local'),
  S3_ENDPOINT: z.string().optional(),
  S3_REGION: z.string().optional(),
  S3_BUCKET: z.string().optional(),
  S3_ACCESS_KEY_ID: z.string().optional(),
  S3_SECRET_ACCESS_KEY: z.string().optional(),
  S3_PUBLIC_URL: z.string().optional(), // публичный базовый URL (CDN/R2)
});

const parsed = schema.safeParse(process.env);

if (!parsed.success) {
  // Падаем рано и явно — иначе сервер поднимется в небезопасном/нерабочем виде.
  console.error('❌ Неверная конфигурация окружения:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
export const isDev = env.NODE_ENV === 'development';
export const isProd = env.NODE_ENV === 'production';
// Демо-режим: включён в dev, при DEMO_MODE=true, ИЛИ когда SMS-провайдер = 'dev'
// (при dev-провайдере реальное SMS не уходит, поэтому вход возможен только по
// фиксированному коду 0000 — иначе демо на проде было бы невозможно войти).
// Для настоящего запуска задайте реальный SMS_PROVIDER — демо-режим отключится.
export const isDemo = isDev || env.DEMO_MODE === 'true' || env.SMS_PROVIDER === 'dev';

export const corsOrigins =
  env.CORS_ORIGINS === '*' ? '*' : env.CORS_ORIGINS.split(',').map((s) => s.trim());
