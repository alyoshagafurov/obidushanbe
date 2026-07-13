/** Отзывы клиентов о доставщиках (после доставки). */
import { Router } from 'express';
import { OrderStatus, UserRole } from '@obi/shared';
import { asyncHandler } from '../lib/asyncHandler';
import { authenticate, requireActive, requireRole } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { prisma } from '../lib/prisma';
import { BadRequest, Conflict, Forbidden, NotFound } from '../lib/errors';
import { createReviewSchema } from '../validation/schemas';
import { recomputeCourierRating } from '../services/order.service';
import { toReviewDto } from '../services/mappers';

export const reviewRouter = Router();
reviewRouter.use(authenticate, requireActive);

// POST /reviews — оставить отзыв и оценку по доставленному заказу
reviewRouter.post(
  '/',
  requireRole(UserRole.CLIENT),
  validate({ body: createReviewSchema }),
  asyncHandler(async (req, res) => {
    const order = await prisma.order.findUnique({ where: { id: req.body.orderId } });
    if (!order) throw NotFound('Заказ не найден');
    if (order.clientId !== req.user!.id) throw Forbidden('Это не ваш заказ');
    if (order.status !== OrderStatus.DELIVERED) throw BadRequest('Отзыв можно оставить только после доставки');
    if (!order.courierId) throw BadRequest('У заказа нет доставщика');

    const existing = await prisma.review.findUnique({ where: { orderId: order.id } });
    if (existing) throw Conflict('Отзыв по этому заказу уже оставлен');

    const review = await prisma.review.create({
      data: {
        orderId: order.id,
        clientId: req.user!.id,
        courierId: order.courierId,
        rating: req.body.rating,
        text: req.body.text ?? null,
      },
      include: { client: true },
    });

    await recomputeCourierRating(order.courierId);
    res.status(201).json(toReviewDto(review));
  }),
);
