/** Профиль текущего пользователя, сохранённые адреса, выдача URL для загрузки фото. */
import { Router } from 'express';
import { randomUUID } from 'crypto';
import { asyncHandler } from '../lib/asyncHandler';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { prisma } from '../lib/prisma';
import { toMeResponse } from '../services/mappers';
import { storage } from '../services/storage.service';
import { NotFound } from '../lib/errors';
import {
  updateProfileSchema,
  createAddressSchema,
  uploadUrlSchema,
} from '../validation/schemas';

export const userRouter = Router();
userRouter.use(authenticate);

// GET /users/me
userRouter.get(
  '/me',
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw NotFound('Пользователь не найден');
    res.json(toMeResponse(user));
  }),
);

// PATCH /users/me — обновить имя (в т.ч. при первом входе)
userRouter.patch(
  '/me',
  validate({ body: updateProfileSchema }),
  asyncHandler(async (req, res) => {
    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: { name: req.body.name },
    });
    res.json(toMeResponse(user));
  }),
);

// GET /users/me/addresses
userRouter.get(
  '/me/addresses',
  asyncHandler(async (req, res) => {
    const addresses = await prisma.address.findMany({
      where: { clientId: req.user!.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json(addresses);
  }),
);

// POST /users/me/addresses
userRouter.post(
  '/me/addresses',
  validate({ body: createAddressSchema }),
  asyncHandler(async (req, res) => {
    const { label, point, text, landmark } = req.body;
    const address = await prisma.address.create({
      data: {
        clientId: req.user!.id,
        label: label ?? null,
        lat: point?.lat ?? null,
        lng: point?.lng ?? null,
        text: text ?? null,
        landmark: landmark ?? null,
      },
    });
    res.status(201).json(address);
  }),
);

// DELETE /users/me/addresses/:id
userRouter.delete(
  '/me/addresses/:id',
  asyncHandler(async (req, res) => {
    await prisma.address.deleteMany({
      where: { id: req.params.id, clientId: req.user!.id },
    });
    res.json({ ok: true });
  }),
);

// POST /users/me/upload-url — presigned URL для загрузки фото (товар/аватар)
userRouter.post(
  '/me/upload-url',
  validate({ body: uploadUrlSchema }),
  asyncHandler(async (req, res) => {
    const ext = req.body.contentType.split('/')[1].replace('jpeg', 'jpg');
    const key = `${req.body.kind}/${req.user!.id}/${randomUUID()}.${ext}`;
    const target = await storage.createUploadUrl(key, req.body.contentType);
    res.json(target);
  }),
);
