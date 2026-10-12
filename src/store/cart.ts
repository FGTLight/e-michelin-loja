'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { normalizeQty, round2 } from '@/lib/utils';
import type { CartItem } from '@/types';

interface CartState {
  items: CartItem[];
  couponCode: string;
  add: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  addMany: (list: { item: Omit<CartItem, 'quantity'>; quantity: number }[]) => void;
  setQuantity: (productId: string, quantity: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
  setCoupon: (code: string) => void;
}

const clampQty = (item: Omit<CartItem, 'quantity'>, qty: number) =>
  Math.min(normalizeQty(qty, item.minQty, item.qtyStep), Math.max(item.stock, item.minQty));

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      couponCode: '',
      add: (item, quantity = item.minQty) =>
        set((s) => {
          const existing = s.items.find((i) => i.productId === item.productId);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.productId === item.productId ? { ...i, ...item, quantity: clampQty(item, i.quantity + quantity) } : i,
              ),
            };
          }
          return { items: [...s.items, { ...item, quantity: clampQty(item, quantity) }] };
        }),
      addMany: (list) =>
        set((s) => {
          const items = [...s.items];
          for (const { item, quantity } of list) {
            const idx = items.findIndex((i) => i.productId === item.productId);
            if (idx >= 0) items[idx] = { ...items[idx], ...item, quantity: clampQty(item, items[idx].quantity + quantity) };
            else items.push({ ...item, quantity: clampQty(item, quantity) });
          }
          return { items };
        }),
      setQuantity: (productId, quantity) =>
        set((s) => ({
          items: s.items.map((i) => (i.productId === productId ? { ...i, quantity: clampQty(i, quantity) } : i)),
        })),
      remove: (productId) => set((s) => ({ items: s.items.filter((i) => i.productId !== productId) })),
      clear: () => set({ items: [], couponCode: '' }),
      setCoupon: (couponCode) => set({ couponCode: couponCode.toUpperCase() }),
    }),
    { name: 'emichelin-cart', version: 1, storage: createJSONStorage(() => localStorage) },
  ),
);

export const cartSubtotal = (items: CartItem[]) => round2(items.reduce((s, i) => s + i.price * i.quantity, 0));
export const cartCount = (items: CartItem[]) => items.length;
export const cartWeight = (items: CartItem[]) => items.reduce((s, i) => s + i.weightKg * i.quantity, 0);
