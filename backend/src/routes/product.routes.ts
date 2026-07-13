/** Каталог товаров (чтение для всех авторизованных). Управление — в admin.routes. */
import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler';
import { authenticate, requireActive } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { toProductDto } from '../services/mappers';

export const productRouter = Router();
productRouter.use(authenticate, requireActive);

// GET /products — только активные товары, по порядку сортировки
productRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    res.json(products.map(toProductDto));
  }),
);
