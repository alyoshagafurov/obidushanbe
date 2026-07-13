/** Публичная страница доставщика: профиль + отзывы (видны всем авторизованным). */
import { Router } from 'express';
import { UserRole } from '@obi/shared';
import { asyncHandler } from '../lib/asyncHandler';
import { authenticate, requireActive } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { NotFound } from '../lib/errors';
import { toCourierPublicProfile, toReviewDto } from '../services/mappers';

export const courierRouter = Router();
courierRouter.use(authenticate, requireActive);

// GET /couriers/:id — публичный профиль доставщика
courierRouter.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findFirst({
      where: { id: req.params.id, role: UserRole.COURIER },
      include: { courierProfile: true },
    });
    if (!user) throw NotFound('Доставщик не найден');
    res.json(toCourierPublicProfile(user));
  }),
);

// GET /couriers/:id/reviews — отзывы о доставщике
courierRouter.get(
  '/:id/reviews',
  asyncHandler(async (req, res) => {
    const reviews = await prisma.review.findMany({
      where: { courierId: req.params.id },
      include: { client: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    res.json(reviews.map(toReviewDto));
  }),
);
