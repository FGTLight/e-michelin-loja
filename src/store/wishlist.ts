'use client';

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export interface WishItem {
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  price: number;
}

interface WishlistState {
  items: WishItem[];
  toggle: (item: WishItem) => void;
  has: (productId: string) => boolean;
  remove: (productId: string) => void;
}

export const useWishlist = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      toggle: (item) =>
        set((s) => ({
          items: s.items.some((i) => i.productId === item.productId)
            ? s.items.filter((i) => i.productId !== item.productId)
            : [item, ...s.items],
        })),
      has: (id) => get().items.some((i) => i.productId === id),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.productId !== id) })),
    }),
    { name: 'emichelin-wishlist', storage: createJSONStorage(() => localStorage) },
  ),
);
