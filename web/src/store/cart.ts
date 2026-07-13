import { create } from 'zustand';
import { Product } from '@obi/shared';

export interface CartLine { product: Product; quantity: number }

interface CartState {
  lines: Record<string, CartLine>;
  add: (p: Product) => void;
  remove: (id: string) => void;
  clear: () => void;
  count: () => number;
  total: () => number;
  items: () => CartLine[];
}

export const useCart = create<CartState>((set, get) => ({
  lines: {},
  add: (product) =>
    set((s) => {
      const q = (s.lines[product.id]?.quantity ?? 0) + 1;
      return { lines: { ...s.lines, [product.id]: { product, quantity: q } } };
    }),
  remove: (id) =>
    set((s) => {
      const next = { ...s.lines };
      const line = next[id];
      if (!line) return s;
      if (line.quantity <= 1) delete next[id];
      else next[id] = { ...line, quantity: line.quantity - 1 };
      return { lines: next };
    }),
  clear: () => set({ lines: {} }),
  count: () => Object.values(get().lines).reduce((s, l) => s + l.quantity, 0),
  total: () => Object.values(get().lines).reduce((s, l) => s + l.product.price * l.quantity, 0),
  items: () => Object.values(get().lines),
}));
