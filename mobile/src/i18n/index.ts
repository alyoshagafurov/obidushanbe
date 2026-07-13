/**
 * Простейшая локализация. Сейчас один язык (ru). Чтобы добавить таджикский:
 *  1) создайте ./tg.ts с такой же структурой, как ru;
 *  2) добавьте его в `dictionaries` и переключайте `currentLang`.
 */
import { ru, Dictionary } from './ru';

const dictionaries: Record<string, Dictionary> = { ru };

let currentLang = 'ru';

export function setLanguage(lang: string) {
  if (dictionaries[lang]) currentLang = lang;
}

/** Текущий словарь. Использование: `t().catalog.title`. */
export function t(): Dictionary {
  return dictionaries[currentLang];
}

/** Хелпер для статуса заказа на русском. */
export function statusLabel(status: keyof Dictionary['orders']['statuses']): string {
  return t().orders.statuses[status] ?? status;
}
