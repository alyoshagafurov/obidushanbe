import { CURRENCY_SYMBOL } from '@obi/shared';

/** Денежный формат: «18 смн». */
export function money(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  const s = Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
  return `${s} ${CURRENCY_SYMBOL}`;
}

/** Короткая дата-время: «28.06, 14:30». */
export function dateTime(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Дата: «28.06.2026». */
export function dateOnly(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()}`;
}
