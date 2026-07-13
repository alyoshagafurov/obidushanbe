/**
 * Реалтайм через Socket.IO.
 *  - аутентификация по JWT при рукопожатии (handshake.auth.token);
 *  - каждый пользователь входит в свою персональную комнату `user:<id>`;
 *  - доставщики дополнительно входят в комнату `couriers` (общий список новых заказов).
 *
 * Доставка сообщений — строго адресная (по комнатам), поэтому клиент не может
 * подслушать чужие события. Запись в БД и проверка прав — в REST-роутах/сервисах,
 * сокет используется только для доставки уже авторизованных событий.
 */
import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { OrderDto, ChatMessageDto, OrderTakenPayload, SocketEvent, UserRole } from '@obi/shared';
import { verifyAccessToken } from '../lib/jwt';
import { prisma } from '../lib/prisma';
import { corsOrigins } from '../config/env';
import { logger } from '../lib/logger';

let io: Server | null = null;

const userRoom = (userId: string) => `user:${userId}`;
const COURIERS_ROOM = 'couriers';

export function initRealtime(server: HttpServer): Server {
  io = new Server(server, {
    cors: { origin: corsOrigins, credentials: true },
  });

  // Аутентификация сокета
  io.use(async (socket, next) => {
    try {
      const token = (socket.handshake.auth?.token as string | undefined) ?? '';
      if (!token) return next(new Error('Нет токена'));
      const payload = verifyAccessToken(token);
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, role: true, isActive: true },
      });
      if (!user || !user.isActive) return next(new Error('Доступ запрещён'));
      socket.data.userId = user.id;
      socket.data.role = user.role;
      next();
    } catch {
      next(new Error('Недействительный токен'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const userId = socket.data.userId as string;
    const role = socket.data.role as UserRole;
    socket.join(userRoom(userId));
    if (role === UserRole.COURIER) socket.join(COURIERS_ROOM);
    logger.debug('socket connected', { userId, role });

    socket.on('disconnect', () => logger.debug('socket disconnected', { userId }));
  });

  return io;
}

export function getIo(): Server | null {
  return io;
}

/* --------------------- Адресные emit-помощники --------------------- */

/** Новый неназначенный заказ — всем доставщикам. */
export function emitOrderNew(order: OrderDto) {
  io?.to(COURIERS_ROOM).emit(SocketEvent.ORDER_NEW, order);
}

/** Заказ кем-то взят — убрать из общего списка у всех доставщиков + уведомить клиента. */
export function emitOrderTaken(payload: OrderTakenPayload, clientId: string) {
  io?.to(COURIERS_ROOM).emit(SocketEvent.ORDER_TAKEN, payload);
  io?.to(userRoom(clientId)).emit(SocketEvent.ORDER_UPDATED, payload);
}

/** Обновление заказа — конкретным пользователям (клиент, доставщик). */
export function emitOrderUpdated(order: OrderDto, recipientUserIds: (string | null | undefined)[]) {
  for (const id of recipientUserIds) {
    if (id) io?.to(userRoom(id)).emit(SocketEvent.ORDER_UPDATED, order);
  }
}

/** Новое сообщение чата — отправителю (синхронизация устройств) и получателю. */
export function emitChatMessage(message: ChatMessageDto) {
  io?.to(userRoom(message.recipientId)).emit(SocketEvent.CHAT_MESSAGE, message);
  io?.to(userRoom(message.senderId)).emit(SocketEvent.CHAT_MESSAGE, message);
}
