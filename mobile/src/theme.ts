/**
 * ТЕМА «ОБИ ДУШАНБЕ» — премиальный стиль (вдохновлён Apple × Porsche):
 * графитовый «металл» как структурный цвет, фирменная вода-azure как сигнатура,
 * чёткий красный акцент (как Guards Red), много воздуха и крупная типографика.
 *
 * Всё берётся отсюда — поменяете токены, изменится весь интерфейс.
 */

export const colors = {
  // Сигнатура — фирменная «вода»
  primary: '#0E72C9',
  primaryDark: '#0A5599',
  primaryLight: '#E7F1FB',
  accent: '#D5001C', // Guards Red — акцент/важные действия

  // Графит (Porsche) — тёмные структурные поверхности (hero, тёмные CTA)
  ink: '#0E141B',
  inkSoft: '#1A2430',
  inkMuted: '#2C3848',

  // Статусы
  success: '#1A9D58',
  warning: '#E0A100',
  danger: '#D5001C',
  info: '#0E72C9',

  // Поверхности
  background: '#F1F4F8',
  surface: '#FFFFFF',
  surfaceAlt: '#F7F9FC',
  card: '#FFFFFF',
  border: '#E5EAF1',
  hairline: '#EEF1F6',

  // Текст
  text: '#0E141B',
  textSecondary: '#54616F',
  textMuted: '#93A1AE',
  onPrimary: '#FFFFFF',
  onDark: '#FFFFFF',
  onDarkMuted: 'rgba(255,255,255,0.7)',

  // Прочее
  star: '#F5A623',
  overlay: 'rgba(10,16,22,0.55)',
};

/** Градиенты (для LinearGradient). */
export const gradients = {
  // Графит -> глубокая вода: премиальная «глубина»
  hero: ['#0E141B', '#16293B', '#0E72C9'] as const,
  ink: ['#1A2430', '#0E141B'] as const,
  blue: ['#1F8AE0', '#0A5599'] as const,
  // мягкая подложка карточек-героев
  steel: ['#222C39', '#11161D'] as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 44,
};

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const typography = {
  // Системный шрифт (на iOS — SF Pro), что и даёт «эпловский» вид.
  fontFamily: undefined as string | undefined,
  display: { fontSize: 34, fontWeight: '800' as const, letterSpacing: -0.6 },
  h1: { fontSize: 28, fontWeight: '800' as const, letterSpacing: -0.4 },
  h2: { fontSize: 22, fontWeight: '700' as const, letterSpacing: -0.3 },
  h3: { fontSize: 17, fontWeight: '600' as const, letterSpacing: -0.2 },
  body: { fontSize: 16, fontWeight: '400' as const },
  small: { fontSize: 13.5, fontWeight: '400' as const },
  caption: { fontSize: 11.5, fontWeight: '600' as const, letterSpacing: 0.4 },
};

export const brand = {
  name: 'ОБИ ДУШАНБЕ',
  tagline: 'Доставка чистой воды',
  logo: null as number | null,
};

/** Мягкие, «дорогие» тени (низкая непрозрачность, большой радиус). */
export const shadow = {
  soft: {
    shadowColor: '#0B1B2B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  card: {
    shadowColor: '#0B1B2B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.07,
    shadowRadius: 20,
    elevation: 4,
  },
  floating: {
    shadowColor: '#0B1B2B',
    shadowOffset: { width: 0, height: 14 },
    shadowOpacity: 0.16,
    shadowRadius: 28,
    elevation: 10,
  },
};

export const theme = { colors, gradients, spacing, radius, typography, brand, shadow };
export type Theme = typeof theme;
