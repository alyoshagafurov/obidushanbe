/**
 * Конфигурация веб-приложения.
 * apiUrl:
 *  - если задан VITE_API_URL — используем его;
 *  - иначе в dev → http://localhost:4000, в проде → '' (тот же домен, /api same-origin).
 * Это значит: собранный сайт по умолчанию ходит на API того же домена, откуда открыт.
 */
const envApi = import.meta.env.VITE_API_URL as string | undefined;
const apiUrl = envApi !== undefined ? envApi : import.meta.env.DEV ? 'http://localhost:4000' : '';

export const config = {
  apiUrl,
  wsUrl: (import.meta.env.VITE_WS_URL as string | undefined) ?? apiUrl,
  // Контакты компании — для лендинга/футера (поменяйте на реальные).
  phones: ['235-88-70', '93-501-56-25', '94-823-39-39'],
  address: 'г. Душанбе',
};
