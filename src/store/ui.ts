'use client';

import { create } from 'zustand';

export interface FlyingItem {
  id: number;
  image: string | null;
  from: { x: number; y: number; w: number; h: number };
  /** centro do ícone do carrinho no momento do clique */
  to: { x: number; y: number };
}

interface UiState {
  cartOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  flying: FlyingItem[];
  /** Incrementa a cada item que "pousa" no carrinho — usado para animar o contador */
  cartBump: number;
  fly: (image: string | null, el: HTMLElement | null) => void;
  land: (id: number) => void;
}

let seq = 0;

export const useUi = create<UiState>()((set) => ({
  cartOpen: false,
  openCart: () => set({ cartOpen: true }),
  closeCart: () => set({ cartOpen: false }),
  flying: [],
  cartBump: 0,
  fly: (image, el) => {
    const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!el || reduce) {
      set((s) => ({ cartBump: s.cartBump + 1 }));
      return;
    }
    const r = el.getBoundingClientRect();
    const c = document.getElementById('cart-icon')?.getBoundingClientRect();
    const to = c ? { x: c.left + c.width / 2, y: c.top + c.height / 2 } : { x: window.innerWidth - 40, y: 40 };
    set((s) => ({ flying: [...s.flying, { id: ++seq, image, from: { x: r.left, y: r.top, w: r.width, h: r.height }, to }] }));
  },
  land: (id) => set((s) => ({ flying: s.flying.filter((f) => f.id !== id), cartBump: s.cartBump + 1 })),
}));
