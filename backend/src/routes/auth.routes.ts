/** Маршруты аутентификации: запрос кода, проверка кода, обновление токенов. */
import { Router } from 'express';
import { asyncHandler } from '../lib/asyncHandler';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/auth';
import { requestSmsLimiter, verifyLimiter } from '../middleware/rateLimit';
import { requestCode, verifyCode, refreshTokens, completeRegistration } from '../services/auth.service';
import {
  requestCodeSchema,
  verifyCodeSchema,
  refreshSchema,
  completeRegistrationSchema,
} from '../validation/schemas';

export const authRouter = Router();

// POST /auth/request-code — запросить SMS-код
authRouter.post(
  '/request-code',
  requestSmsLimiter,
  validate({ body: requestCodeSchema }),
  asyncHandler(async (req, res) => {
    const result = await requestCode(req.body.phone, req.ip);
    res.json({ ok: true, ...result });
  }),
);

// POST /auth/verify — проверить код и войти
authRouter.post(
  '/verify',
  verifyLimiter,
  validate({ body: verifyCodeSchema }),
  asyncHandler(async (req, res) => {
    const result = await verifyCode(req.body.phone, req.body.code, req.ip);
    res.json(result);
  }),
);

// POST /auth/refresh — обновить токены
authRouter.post(
  '/refresh',
  validate({ body: refreshSchema }),
  asyncHandler(async (req, res) => {
    const tokens = await refreshTokens(req.body.refreshToken);
    res.json(tokens);
  }),
);

// POST /auth/complete-registration — завершить регистрацию (имя + роль)
authRouter.post(
  '/complete-registration',
  authenticate,
  validate({ body: completeRegistrationSchema }),
  asyncHandler(async (req, res) => {
    const me = await completeRegistration(req.user!.id, req.body);
    res.json(me);
  }),
);
