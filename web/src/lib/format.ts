import { CURRENCY_SYMBOL } from '@obi/shared';

export function money(v: number): string {
  const r = Math.round(v * 100) / 100;
  return `${Number.isInteger(r) ? r : r.toFixed(2)} ${CURRENCY_SYMBOL}`;
}
export function dateTime(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}, ${p(d.getHours())}:${p(d.getMinutes())}`;
}
export function dateOnly(iso: string): string {
  const d = new Date(iso);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}
export function productImg(type: string, photoUrl?: string | null): string {
  if (photoUrl) return photoUrl;
  const map: Record<string, string> = {
    WATER_20L: '/products/water20.webp',
    WATER_05L: '/products/water05.webp',
    COOLER: '/products/cooler.webp',
    PUMP_MANUAL: '/products/pump_manual.webp',
    PUMP_ELECTRIC: '/products/pump_electric.webp',
  };
  return map[type] ?? '/logo.png';
}
