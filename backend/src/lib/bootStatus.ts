/**
 * Состояние инициализации при старте — отдаётся в /health.
 * Нужно, чтобы диагностировать прод, когда нет доступа к логам контейнера:
 * по marker видно, какой образ реально обслуживает трафик.
 */
export const bootStatus: {
  marker: string;
  schema: string;
  seed: string;
  detail?: string;
} = {
  marker: 'boot-v3',
  schema: 'pending',
  seed: 'pending',
};
