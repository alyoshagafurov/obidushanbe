/** Корзина клиента (локальный стейт). Оплаты нет — считаем только сумму к показу. */
import { create } from 'zustand';
import { Product } from '@obi/shared';

export interface CartLine {
  product: Product;
  quantity: number;
}

interface CartState {
  lines: Record<string, CartLine>; // productId -> line
  add: (product: Product) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
  count: () => number;
  total: () => number;
  items: () => CartLine[];
}

export const useCartStore = create<CartState>((set, get) => ({
  lines: {},

  add: (product) =>
    set((s) => {
      const existing = s.lines[product.id];
      const quantity = (existing?.quantity ?? 0) + 1;
      return { lines: { ...s.lines, [product.id]: { product, quantity } } };
    }),

  remove: (productId) =>
    set((s) => {
      const next = { ...s.lines };
      const line = next[productId];
      if (!line) return s;
      if (line.quantity <= 1) delete next[productId];
      else next[productId] = { ...line, quantity: line.quantity - 1 };
      return { lines: next };
    }),

  setQty: (productId, qty) =>
    set((s) => {
      const line = s.lines[productId];
      if (!line) return s;
      const next = { ...s.lines };
      if (qty <= 0) delete next[productId];
      else next[productId] = { ...line, quantity: qty };
      return { lines: next };
    }),

  clear: () => set({ lines: {} }),

  count: () => Object.values(get().lines).reduce((sum, l) => sum + l.quantity, 0),
  total: () => Object.values(get().lines).reduce((sum, l) => sum + l.product.price * l.quantity, 0),
  items: () => Object.values(get().lines),
}));
