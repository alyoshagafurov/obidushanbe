/**
 * Локальная загрузка файлов (когда STORAGE_PROVIDER=local).
 *  - PUT /api/uploads/<key>  — принимает «сырые» байты картинки и сохраняет на диск;
 *  - статика отдаётся отдельно из app.ts через express.static('/uploads').
 *
 * В проде используйте S3/R2 — тогда эти маршруты не задействуются.
 */
import path from 'path';
import fs from 'fs';
import express, { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler';
import { BadRequest } from '../lib/errors';

export const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

export const uploadsRouter = Router();

// Приём бинарного тела (картинки) до 8 МБ.
uploadsRouter.put(
  '/*',
  express.raw({ type: ['image/*'], limit: '8mb' }),
  asyncHandler(async (req, res) => {
    const key = (req.params as unknown as string[])[0] ?? '';
    // Защита от выхода за пределы папки uploads.
    if (!key || key.includes('..')) throw BadRequest('Некорректный путь файла');
    if (!Buffer.isBuffer(req.body) || req.body.length === 0) throw BadRequest('Пустое тело запроса');

    const target = path.join(UPLOADS_DIR, key);
    if (!target.startsWith(UPLOADS_DIR)) throw BadRequest('Некорректный путь файла');

    await fs.promises.mkdir(path.dirname(target), { recursive: true });
    await fs.promises.writeFile(target, req.body);
    res.json({ ok: true });
  }),
);
