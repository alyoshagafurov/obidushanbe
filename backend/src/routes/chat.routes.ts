/**
 * Чат «клиент ↔ доставщик» (реалтайм через сокет, хранение в БД).
 * Безопасность: пользователь видит ТОЛЬКО свои переписки; право на каждое
 * сообщение проверяется на сервере. Сообщение допустимо между клиентом и
 * доставщиком; при привязке к заказу оба должны быть его участниками.
 */
import { Router } from 'express';
import { UserRole } from '@obi/shared';
import { asyncHandler } from '../lib/asyncHandler';
import { authenticate, requireActive } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { prisma } from '../lib/prisma';
import { BadRequest, Forbidden, NotFound } from '../lib/errors';
import { sendMessageSchema } from '../validation/schemas';
import { toChatMessageDto } from '../services/mappers';
import { emitChatMessage } from '../realtime/socket';

export const chatRouter = Router();
chatRouter.use(authenticate, requireActive);

/** Разрешено ли отправителю писать получателю (опц. в рамках заказа). */
async function assertCanMessage(
  sender: { id: string; role: UserRole },
  recipientId: string,
  orderId?: string | null,
) {
  if (recipientId === sender.id) throw BadRequest('Нельзя писать самому себе');

  const recipient = await prisma.user.findUnique({ where: { id: recipientId } });
  if (!recipient || !recipient.isActive) throw NotFound('Получатель не найден');

  // Чат допустим между клиентом и доставщиком (в любую сторону).
  const pairOk =
    (sender.role === UserRole.CLIENT && recipient.role === UserRole.COURIER) ||
    (sender.role === UserRole.COURIER && recipient.role === UserRole.CLIENT);
  if (!pairOk) throw Forbidden('Недопустимый чат для ваших ролей');

  // Если привязка к заказу — оба должны быть участниками этого заказа.
  if (orderId) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw NotFound('Заказ не найден');
    const ids = [order.clientId, order.courierId];
    if (!ids.includes(sender.id) || !ids.includes(recipientId)) {
      throw Forbidden('Нет доступа к чату этого заказа');
    }
  }
}

// POST /chat — отправить сообщение
chatRouter.post(
  '/',
  validate({ body: sendMessageSchema }),
  asyncHandler(async (req, res) => {
    const sender = { id: req.user!.id, role: req.user!.role };
    await assertCanMessage(sender, req.body.recipientId, req.body.orderId);

    const message = await prisma.chatMessage.create({
      data: {
        senderId: sender.id,
        recipientId: req.body.recipientId,
        orderId: req.body.orderId ?? null,
        text: req.body.text,
      },
    });
    const dto = toChatMessageDto(message);
    emitChatMessage(dto); // мгновенная доставка обоим
    res.status(201).json(dto);
  }),
);

// GET /chat/conversation?withUserId=...&orderId=... — переписка с одним человеком
chatRouter.get(
  '/conversation',
  asyncHandler(async (req, res) => {
    const me = req.user!.id;
    const withUserId = String(req.query.withUserId ?? '');
    if (!withUserId) throw BadRequest('Не указан собеседник');
    const orderId = req.query.orderId ? String(req.query.orderId) : undefined;

    const messages = await prisma.chatMessage.findMany({
      where: {
        ...(orderId ? { orderId } : {}),
        OR: [
          { senderId: me, recipientId: withUserId },
          { senderId: withUserId, recipientId: me },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: 500,
    });

    // Помечаем входящие как прочитанные.
    await prisma.chatMessage.updateMany({
      where: { senderId: withUserId, recipientId: me, read: false },
      data: { read: true },
    });

    res.json(messages.map(toChatMessageDto));
  }),
);

// GET /chat/conversations — список диалогов (последнее сообщение по каждому собеседнику)
chatRouter.get(
  '/conversations',
  asyncHandler(async (req, res) => {
    const me = req.user!.id;
    const recent = await prisma.chatMessage.findMany({
      where: { OR: [{ senderId: me }, { recipientId: me }] },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });

    // Группируем по собеседнику, берём последнее сообщение.
    const seen = new Set<string>();
    const conversations: {
      peerId: string;
      lastMessage: ReturnType<typeof toChatMessageDto>;
      unread: number;
    }[] = [];
    for (const m of recent) {
      const peerId = m.senderId === me ? m.recipientId : m.senderId;
      if (seen.has(peerId)) continue;
      seen.add(peerId);
      const unread = await prisma.chatMessage.count({
        where: { senderId: peerId, recipientId: me, read: false },
      });
      conversations.push({ peerId, lastMessage: toChatMessageDto(m), unread });
    }
    res.json(conversations);
  }),
);
