/**
 * Аутентификация (JWT) и авторизация по ролям (RBAC).
 * Проверка роли ВСЕГДА на сервере — данным с устройства не доверяем.
 */
import { NextFunction, Request, Response } from 'express';
import { UserRole } from '@obi/shared';
import { verifyAccessToken } from '../lib/jwt';
import { prisma } from '../lib/prisma';
import { Forbidden, Unauthorized } from '../lib/errors';

/** Достаёт Bearer-токен, проверяет его и подгружает пользователя (с проверкой активности). */
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw Unauthorized('Отсутствует токен доступа');
    }
    const token = header.slice('Bearer '.length).trim();

    let payload;
    try {
      payload = verifyAccessToken(token);
    } catch {
      throw Unauthorized('Недействительный или истёкший токен');
    }

    // Подтверждаем, что пользователь существует. Неактивных (ожидающих
    // подтверждения / заблокированных) пропускаем сюда, чтобы они могли увидеть
    // статус через /users/me; доступ к действиям ограничивает requireActive.
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, role: true, phone: true, isActive: true },
    });
    if (!user) throw Unauthorized('Пользователь не найден');

    req.user = { id: user.id, role: user.role as UserRole, phone: user.phone, isActive: user.isActive };
    next();
  } catch (e) {
    next(e);
  }
}

/** Требует активную учётную запись (не на модерации и не заблокирована). */
export function requireActive(req: Request, _res: Response, next: NextFunction) {
  if (!req.user) return next(Unauthorized());
  if (!req.user.isActive) {
    return next(Forbidden('Учётная запись ожидает подтверждения администратором или заблокирована'));
  }
  next();
}

/** Разрешает доступ только указанным ролям. */
export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(Unauthorized());
    if (!roles.includes(req.user.role)) {
      return next(Forbidden('Действие недоступно для вашей роли'));
    }
    next();
  };
}
