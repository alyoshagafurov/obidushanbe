/** Конфигурация веб-приложения. Адрес API можно переопределить через VITE_API_URL. */
const apiUrl = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:4000';

export const config = {
  apiUrl,
  wsUrl: (import.meta.env.VITE_WS_URL as string | undefined) ?? apiUrl,
  // Контакты компании — для лендинга/футера (поменяйте на реальные).
  phones: ['235-88-70', '93-501-56-25', '94-823-39-39'],
  address: 'г. Душанбе',
};
