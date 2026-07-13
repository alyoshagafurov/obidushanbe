/**
 * Оператор: быстрый ввод заказа за клиента (приём телефонных звонков).
 * Доступ: OPERATOR и ADMIN.
 */
import { Router } from 'express';
import { UserRole } from '@obi/shared';
import { asyncHandler, viewerOf } from '../lib/asyncHandler';
import { authenticate, requireActive, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { prisma } from '../lib/prisma';
import { createOrder } from '../services/order.service';
import { orderInclude, toOrderDto } from '../services/mappers';
import { operatorCreateOrderSchema, requestCodeSchema } from '../validation/schemas';

export const operatorRouter = Router();
operatorRouter.use(authenticate, requireActive, requireRole(UserRole.OPERATOR, UserRole.ADMIN));

// GET /operator/clients/lookup?phone= — подтянуть клиента по номеру (имя + адреса)
operatorRouter.get(
  '/clients/lookup',
  validate({ query: requestCodeSchema }), // переиспользуем валидатор телефона
  asyncHandler(async (req, res) => {
    const phone = String(req.query.phone);
    const client = await prisma.user.findUnique({
      where: { phone },
      include: { addresses: { orderBy: { createdAt: 'desc' } } },
    });
    if (!client) return res.json({ exists: false });
    res.json({
      exists: true,
      id: client.id,
      name: client.name,
      addresses: client.addresses,
    });
  }),
);

// POST /operator/orders — создать заказ за клиента
operatorRouter.post(
  '/orders',
  validate({ body: operatorCreateOrderSchema }),
  asyncHandler(async (req, res) => {
    const { clientPhone, clientName, items, address } = req.body;

    // Находим или создаём клиента по телефону.
    let client = await prisma.user.findUnique({ where: { phone: clientPhone } });
    if (!client) {
      client = await prisma.user.create({
        data: { phone: clientPhone, name: clientName ?? null, role: UserRole.CLIENT },
      });
    } else if (clientName && !client.name) {
      client = await prisma.user.update({ where: { id: client.id }, data: { name: clientName } });
    }

    const order = await createOrder({
      clientId: client.id,
      operatorId: req.user!.id,
      items,
      address,
    });
    res.status(201).json(order);
  }),
);

// GET /operator/orders — заказы, созданные этим оператором
operatorRouter.get(
  '/orders',
  asyncHandler(async (req, res) => {
    const orders = await prisma.order.findMany({
      where: { operatorId: req.user!.id },
      orderBy: { createdAt: 'desc' },
      take: 200,
      include: orderInclude,
    });
    res.json(orders.map((o) => toOrderDto(o, viewerOf(req))));
  }),
);
