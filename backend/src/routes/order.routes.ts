/** Заказы: создание клиентом, лента доставщика, взятие, смена статуса, просмотр. */
import { Router } from 'express';
import { UserRole } from '@obi/shared';
import { asyncHandler, viewerOf } from '../lib/asyncHandler';
import { authenticate, requireActive, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import {
  createOrder,
  listClientOrders,
  listNewOrders,
  listCourierOrders,
  takeOrder,
  updateOrderStatus,
  getOrderForViewer,
} from '../services/order.service';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  courierLocationQuery,
} from '../validation/schemas';

export const orderRouter = Router();
orderRouter.use(authenticate, requireActive);

// --- Клиент ---

// POST /orders — создать заказ
orderRouter.post(
  '/',
  requireRole(UserRole.CLIENT),
  validate({ body: createOrderSchema }),
  asyncHandler(async (req, res) => {
    const order = await createOrder({
      clientId: req.user!.id,
      items: req.body.items,
      address: req.body.address,
    });
    res.status(201).json(order);
  }),
);

// GET /orders/my — заказы клиента (текущие + история)
orderRouter.get(
  '/my',
  requireRole(UserRole.CLIENT),
  asyncHandler(async (req, res) => {
    res.json(await listClientOrders(req.user!.id, viewerOf(req)));
  }),
);

// --- Доставщик ---

// GET /orders/feed — общий список новых заказов (с расстоянием)
orderRouter.get(
  '/feed',
  requireRole(UserRole.COURIER),
  validate({ query: courierLocationQuery }),
  asyncHandler(async (req, res) => {
    const { lat, lng } = req.query as unknown as { lat?: number; lng?: number };
    const loc = lat != null && lng != null ? { lat, lng } : undefined;
    res.json(await listNewOrders(viewerOf(req), loc));
  }),
);

// GET /orders/courier — мои заказы (active=true|false для истории)
orderRouter.get(
  '/courier',
  requireRole(UserRole.COURIER),
  asyncHandler(async (req, res) => {
    const onlyActive = req.query.active !== 'false';
    res.json(await listCourierOrders(req.user!.id, viewerOf(req), onlyActive));
  }),
);

// POST /orders/:id/take — взять заказ (атомарно)
orderRouter.post(
  '/:id/take',
  requireRole(UserRole.COURIER),
  asyncHandler(async (req, res) => {
    const order = await takeOrder(req.user!.id, req.params.id, viewerOf(req));
    res.json(order);
  }),
);

// POST /orders/:id/status — сменить статус (Принял/В пути/Доставлено/Отмена)
orderRouter.post(
  '/:id/status',
  requireRole(UserRole.COURIER),
  validate({ body: updateOrderStatusSchema }),
  asyncHandler(async (req, res) => {
    const order = await updateOrderStatus(req.user!.id, req.params.id, req.body.status, viewerOf(req));
    res.json(order);
  }),
);

// --- Общий просмотр одного заказа (участник/админ/оператор) ---
orderRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    res.json(await getOrderForViewer(req.params.id, viewerOf(req)));
  }),
);
