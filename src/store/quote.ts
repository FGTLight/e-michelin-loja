'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { SaleUnit } from '@/types';

export interface QuoteItem {
  key: string;
  productId?: string;
  sku?: string;
  description: string;
  unit: SaleUnit;
  quantity: number;
}

interface QuoteState {
  items: QuoteItem[];
  add: (item: Omit<QuoteItem, 'key'>) => void;
  update: (key: string, patch: Partial<QuoteItem>) => void;
  remove: (key: string) => void;
  clear: () => void;
}

export const useQuoteList = create<QuoteState>()(
  persist(
    (set) => ({
      items: [],
      add: (item) =>
        set((s) => {
          const existing = item.productId && s.items.find((i) => i.productId === item.productId);
          if (existing) {
            return { items: s.items.map((i) => (i.key === existing.key ? { ...i, quantity: i.quantity + item.quantity } : i)) };
          }
          return { items: [...s.items, { ...item, key: crypto.randomUUID() }] };
        }),
      update: (key, patch) => set((s) => ({ items: s.items.map((i) => (i.key === key ? { ...i, ...patch } : i)) })),
      remove: (key) => set((s) => ({ items: s.items.filter((i) => i.key !== key) })),
      clear: () => set({ items: [] }),
    }),
    { name: 'emichelin-quote', storage: createJSONStorage(() => localStorage) },
  ),
);
