import { NextFunction, Request, Response } from 'express';

/** Оборачивает async-обработчик, чтобы ошибки уходили в errorHandler. */
export const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

/** Достаёт наблюдателя (viewer) из авторизованного запроса. */
export const viewerOf = (req: Request) => ({ id: req.user!.id, role: req.user!.role });
