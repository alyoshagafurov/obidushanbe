/** Прикладные ошибки с HTTP-кодом. Обрабатываются в errorHandler. */

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code?: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const BadRequest = (m: string, details?: unknown) => new AppError(400, m, 'BAD_REQUEST', details);
export const Unauthorized = (m = 'Требуется авторизация') => new AppError(401, m, 'UNAUTHORIZED');
export const Forbidden = (m = 'Недостаточно прав') => new AppError(403, m, 'FORBIDDEN');
export const NotFound = (m = 'Не найдено') => new AppError(404, m, 'NOT_FOUND');
export const Conflict = (m: string) => new AppError(409, m, 'CONFLICT');
export const TooManyRequests = (m = 'Слишком много запросов') => new AppError(429, m, 'TOO_MANY_REQUESTS');
