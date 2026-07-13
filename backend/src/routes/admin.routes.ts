/**
 * Админ-панель (только ADMIN): статистика, управление товарами, доставщиками,
 * операторами, заказами; просмотр отзывов.
 */
import { Router } from 'express';
import { Prisma } from '@prisma/client';
import { OrderStatus, UserRole } from '@obi/shared';
import { asyncHandler, viewerOf } from '../lib/asyncHandler';
import { authenticate, requireActive, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { prisma } from '../lib/prisma';
import { NotFound } from '../lib/errors';
import { getDashboard, resolveRange } from '../services/stats.service';
import {
  orderInclude,
  toCourierPublicProfile,
  toOrderDto,
  toProductDto,
  toReviewDto,
} from '../services/mappers';
import { emitOrderUpdated } from '../realtime/socket';
import {
  createProductSchema,
  updateProductSchema,
  createStaffSchema,
  updateCourierSchema,
  reassignOrderSchema,
  statsQuerySchema,
  adminOrdersQuery,
} from '../validation/schemas';

export const adminRouter = Router();
adminRouter.use(authenticate, requireActive, requireRole(UserRole.ADMIN));

/* ----------------------------- Статистика ---------------------------- */

adminRouter.get(
  '/stats',
  validate({ query: statsQuerySchema }),
  asyncHandler(async (req, res) => {
    const range = resolveRange(req.query as { from?: string; to?: string; period?: string });
    res.json(await getDashboard(range));
  }),
);

/* ------------------------------ Товары ------------------------------- */

adminRouter.get(
  '/products',
  asyncHandler(async (_req, res) => {
    const products = await prisma.product.findMany({ orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
    res.json(products.map(toProductDto));
  }),
);

adminRouter.post(
  '/products',
  validate({ body: createProductSchema }),
  asyncHandler(async (req, res) => {
    const product = await prisma.product.create({
      data: { ...req.body, price: new Prisma.Decimal(req.body.price) },
    });
    res.status(201).json(toProductDto(product));
  }),
);

adminRouter.patch(
  '/products/:id',
  validate({ body: updateProductSchema }),
  asyncHandler(async (req, res) => {
    const data: Prisma.ProductUpdateInput = { ...req.body };
    if (req.body.price != null) data.price = new Prisma.Decimal(req.body.price);
    const product = await prisma.product.update({ where: { id: req.params.id }, data });
    res.json(toProductDto(product));
  }),
);

adminRouter.delete(
  '/products/:id',
  asyncHandler(async (req, res) => {
    // Мягкое удаление: товар мог участвовать в заказах. Деактивируем.
    await prisma.product.update({ where: { id: req.params.id }, data: { isActive: false } });
    res.json({ ok: true });
  }),
);

/* ------------------------- Доставщики/операторы ---------------------- */

// Создать сотрудника (доставщика или оператора)
adminRouter.post(
  '/staff',
  validate({ body: createStaffSchema }),
  asyncHandler(async (req, res) => {
    const { phone, name, role, bio } = req.body;
    const user = await prisma.user.create({
      data: {
        phone,
        name,
        role,
        ...(role === UserRole.COURIER
          ? { courierProfile: { create: { bio: bio ?? null } } }
          : {}),
      },
      include: { courierProfile: true },
    });
    res.status(201).json({ id: user.id, phone: user.phone, name: user.name, role: user.role });
  }),
);

// Список доставщиков (с профилем)
adminRouter.get(
  '/couriers',
  asyncHandler(async (_req, res) => {
    const couriers = await prisma.user.findMany({
      where: { role: UserRole.COURIER },
      include: { courierProfile: true },
      orderBy: { createdAt: 'asc' },
    });
    res.json(
      couriers.map((c) => ({
        ...toCourierPublicProfile(c),
        phone: c.phone, // админу телефон доставщика виден
        isActive: c.isActive,
        territory: c.courierProfile?.territory ?? null,
      })),
    );
  }),
);

// Обновить доставщика (имя, профиль, территория, блокировка)
adminRouter.patch(
  '/couriers/:id',
  validate({ body: updateCourierSchema }),
  asyncHandler(async (req, res) => {
    const { name, isActive, bio, photoUrl, territory } = req.body;
    const user = await prisma.user.findFirst({
      where: { id: req.params.id, role: UserRole.COURIER },
    });
    if (!user) throw NotFound('Доставщик не найден');

    await prisma.user.update({
      where: { id: user.id },
      data: {
        ...(name != null ? { name } : {}),
        ...(isActive != null ? { isActive } : {}),
      },
    });
    await prisma.courierProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        bio: bio ?? null,
        photoUrl: photoUrl ?? null,
        territory: territory ?? Prisma.JsonNull,
      },
      update: {
        ...(bio !== undefined ? { bio } : {}),
        ...(photoUrl !== undefined ? { photoUrl } : {}),
        ...(territory !== undefined ? { territory: territory ?? Prisma.JsonNull } : {}),
      },
    });
    const updated = await prisma.user.findUniqueOrThrow({
      where: { id: user.id },
      include: { courierProfile: true },
    });
    res.json({ ...toCourierPublicProfile(updated), phone: updated.phone, isActive: updated.isActive });
  }),
);

// Операторы
adminRouter.get(
  '/operators',
  asyncHandler(async (_req, res) => {
    const operators = await prisma.user.findMany({
      where: { role: UserRole.OPERATOR },
      orderBy: { createdAt: 'asc' },
    });
    res.json(operators.map((o) => ({ id: o.id, name: o.name, phone: o.phone, isActive: o.isActive })));
  }),
);

// Кассиры
adminRouter.get(
  '/cashiers',
  asyncHandler(async (_req, res) => {
    const cashiers = await prisma.user.findMany({
      where: { role: UserRole.CASHIER },
      orderBy: { createdAt: 'asc' },
    });
    res.json(cashiers.map((c) => ({ id: c.id, name: c.name, phone: c.phone, isActive: c.isActive })));
  }),
);

// Блокировка/разблокировка сотрудника (доставщик/оператор)
adminRouter.patch(
  '/staff/:id/active',
  asyncHandler(async (req, res) => {
    const isActive = Boolean(req.body?.isActive);
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: { isActive },
    });
    res.json({ id: user.id, isActive: user.isActive });
  }),
);

/* ------------------------------- Заказы ------------------------------ */

adminRouter.get(
  '/orders',
  validate({ query: adminOrdersQuery }),
  asyncHandler(async (req, res) => {
    const { status, courierId, from, to } = req.query as {
      status?: OrderStatus;
      courierId?: string;
      from?: string;
      to?: string;
    };
    const where: Prisma.OrderWhereInput = {
      ...(status ? { status } : {}),
      ...(courierId ? { courierId } : {}),
      ...(from || to
        ? { createdAt: { ...(from ? { gte: new Date(from) } : {}), ...(to ? { lte: new Date(to) } : {}) } }
        : {}),
    };
    const orders = await prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: 'desc' },
      take: 300,
    });
    res.json(orders.map((o) => toOrderDto(o, viewerOf(req))));
  }),
);

// Ручное переназначение заказа другому доставщику (или снятие назначения)
adminRouter.post(
  '/orders/:id/reassign',
  validate({ body: reassignOrderSchema }),
  asyncHandler(async (req, res) => {
    const { courierId } = req.body as { courierId: string | null };
    const order = await prisma.order.findUnique({ where: { id: req.params.id } });
    if (!order) throw NotFound('Заказ не найден');

    let data: Prisma.OrderUpdateInput;
    if (courierId) {
      const courier = await prisma.user.findFirst({ where: { id: courierId, role: UserRole.COURIER } });
      if (!courier) throw NotFound('Доставщик не найден');
      data = {
        courier: { connect: { id: courierId } },
        status: order.status === OrderStatus.NEW ? OrderStatus.ON_WAY : order.status,
        takenAt: order.takenAt ?? new Date(),
      };
    } else {
      // снять назначение — вернуть в общий список
      data = { courier: { disconnect: true }, status: OrderStatus.NEW, takenAt: null };
    }

    await prisma.order.update({ where: { id: order.id }, data });
    const updated = await prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: orderInclude });
    const dto = toOrderDto(updated, viewerOf(req));
    emitOrderUpdated(dto, [updated.clientId, updated.courierId, order.courierId]);
    res.json(dto);
  }),
);

/* ------------------------------- Отзывы ------------------------------ */

adminRouter.get(
  '/reviews',
  asyncHandler(async (_req, res) => {
    const reviews = await prisma.review.findMany({
      include: { client: true, courier: true },
      orderBy: { createdAt: 'desc' },
      take: 300,
    });
    res.json(
      reviews.map((r) => ({
        ...toReviewDto(r),
        courierId: r.courierId,
        courierName: r.courier?.name ?? 'Доставщик',
      })),
    );
  }),
);
