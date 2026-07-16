/**
 * Аутентификация по телефону + SMS-код.
 * Безопасность:
 *  - код хранится только в виде bcrypt-хеша, с TTL и счётчиком попыток;
 *  - неудачные попытки и спам логируются в SecurityLog;
 *  - JWT: короткоживущий access + refresh (с ротацией).
 */
import bcrypt from 'bcryptjs';
import {
  DEV_SMS_CODE,
  LoginResponse,
  MeResponse,
  SMS_CODE_MAX_ATTEMPTS,
  SMS_CODE_TTL_MINUTES,
  UserRole,
} from '@obi/shared';
import { prisma } from '../lib/prisma';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/jwt';
import { BadRequest, Forbidden, TooManyRequests, Unauthorized } from '../lib/errors';
import { securityLog } from '../lib/logger';
import { generateSmsCode, sendVerificationCode } from './sms.service';
import { env, isDemo } from '../config/env';
import { toMeResponse } from './mappers';

/** Запросить SMS-код для входа. */
export async function requestCode(phone: string, ip?: string): Promise<{ devCode?: string }> {
  const code = generateSmsCode();
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + SMS_CODE_TTL_MINUTES * 60 * 1000);

  // Инвалидируем предыдущие неиспользованные коды этого номера.
  await prisma.smsCode.updateMany({
    where: { phone, consumed: false },
    data: { consumed: true },
  });

  await prisma.smsCode.create({ data: { phone, codeHash, expiresAt } });

  try {
    await sendVerificationCode(phone, code);
  } catch (e) {
    await securityLog({ event: 'SMS_SEND_FAILED', phone, ip, meta: { error: String(e) } });
    throw BadRequest('Не удалось отправить SMS. Попробуйте позже.');
  }

  // В демо-режиме отдаём код в ответе (удобно тестировать / показывать).
  if (isDemo && env.SMS_PROVIDER === 'dev') return { devCode: DEV_SMS_CODE };
  return {};
}

/** Проверить код и войти (или зарегистрировать клиента при первом входе). */
export async function verifyCode(phone: string, code: string, ip?: string): Promise<LoginResponse> {
  const smsCode = await prisma.smsCode.findFirst({
    where: { phone, consumed: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: 'desc' },
  });

  if (!smsCode) {
    await securityLog({ event: 'LOGIN_NO_CODE', phone, ip });
    throw BadRequest('Код не найден или истёк. Запросите новый.');
  }

  if (smsCode.attempts >= SMS_CODE_MAX_ATTEMPTS) {
    await prisma.smsCode.update({ where: { id: smsCode.id }, data: { consumed: true } });
    await securityLog({ event: 'LOGIN_TOO_MANY_ATTEMPTS', phone, ip });
    throw TooManyRequests('Превышено число попыток. Запросите новый код.');
  }

  const ok = await bcrypt.compare(code, smsCode.codeHash);
  if (!ok) {
    await prisma.smsCode.update({
      where: { id: smsCode.id },
      data: { attempts: { increment: 1 } },
    });
    await securityLog({ event: 'LOGIN_FAILED', phone, ip, meta: { attempt: smsCode.attempts + 1 } });
    throw BadRequest('Неверный код');
  }

  // Успех — гасим код.
  await prisma.smsCode.update({ where: { id: smsCode.id }, data: { consumed: true } });

  // Находим или создаём пользователя. Новый — пока без роли (выберет при регистрации).
  let user = await prisma.user.findUnique({ where: { phone } });
  let isNewUser = false;
  if (!user) {
    user = await prisma.user.create({ data: { phone, role: UserRole.CLIENT } });
    isNewUser = true;
  }

  // Считается «новым» (нужно завершить регистрацию: имя + роль), пока имя не указано.
  if (!user.name) isNewUser = true;

  return {
    accessToken: signAccessToken(user.id, user.role as UserRole),
    refreshToken: signRefreshToken(user.id),
    user: toMeResponse(user),
    isNewUser,
  };
}

/** Обновить пару токенов по refresh-токену (с ротацией refresh). */
export async function refreshTokens(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw Unauthorized('Недействительный refresh-токен');
  }
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive) throw Unauthorized('Доступ запрещён');

  return {
    accessToken: signAccessToken(user.id, user.role as UserRole),
    refreshToken: signRefreshToken(user.id),
  };
}

/**
 * Завершение регистрации: пользователь задаёт имя и выбирает роль.
 * Правила (по требованию владельца):
 *  - КЛИЕНТ — активен сразу;
 *  - ДОСТАВЩИК / ОПЕРАТОР — создаются неактивными (ждут подтверждения админом);
 *  - АДМИН — только при верном ADMIN_REGISTER_CODE.
 * Роль задаётся ОДИН раз (пока имя не указано); потом сменить роль нельзя
 * (защита от повышения привилегий).
 */
export async function completeRegistration(
  userId: string,
  input: { name: string; role: UserRole; adminCode?: string },
): Promise<MeResponse> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Unauthorized('Пользователь не найден');

  // Регистрация уже завершена — разрешаем менять только имя, роль фиксирована.
  if (user.name) {
    const updated = await prisma.user.update({ where: { id: userId }, data: { name: input.name } });
    return toMeResponse(updated);
  }

  let isActive = true;
  if (input.role === UserRole.ADMIN) {
    if (!env.ADMIN_REGISTER_CODE || input.adminCode !== env.ADMIN_REGISTER_CODE) {
      await securityLog({ event: 'ADMIN_REGISTER_BAD_CODE', userId, phone: user.phone });
      throw Forbidden('Неверный код администратора');
    }
  } else if (input.role === UserRole.COURIER || input.role === UserRole.OPERATOR) {
    isActive = false; // ждёт подтверждения админом
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      name: input.name,
      role: input.role,
      isActive,
      ...(input.role === UserRole.COURIER
        ? { courierProfile: { upsert: { create: {}, update: {} } } }
        : {}),
    },
  });
  return toMeResponse(updated);
}
