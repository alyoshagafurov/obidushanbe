/**
 * Валидация входных данных через Zod. Никогда не доверяем данным с устройства.
 * Валидированные данные кладём обратно в req (body/query/params).
 */
import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from '../lib/errors';

type Schemas = {
  body?: AnyZodObject;
  query?: AnyZodObject;
  params?: AnyZodObject;
};

export function validate(schemas: Schemas) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) req.body = schemas.body.parse(req.body);
      if (schemas.query) req.query = schemas.query.parse(req.query) as typeof req.query;
      if (schemas.params) req.params = schemas.params.parse(req.params) as typeof req.params;
      next();
    } catch (e) {
      if (e instanceof ZodError) {
        next(new AppError(400, 'Ошибка валидации', 'VALIDATION_ERROR', e.flatten()));
      } else {
        next(e);
      }
    }
  };
}
