'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Check, ShoppingCart } from 'lucide-react';
import { useRef, useState } from 'react';
import { toCartItem } from '@/lib/cart-helpers';
import { cn } from '@/lib/utils';
import { useCart } from '@/store/cart';
import { useUi } from '@/store/ui';
import type { Product } from '@/types';

interface Props {
  product: Product;
  quantity?: number;
  /** elemento cuja imagem "voa" até o carrinho (default: o próprio botão) */
  sourceRef?: React.RefObject<HTMLElement>;
  className?: string;
  label?: string;
  openDrawer?: boolean;
}

export function AddToCartButton({ product, quantity, sourceRef, className, label = 'Adicionar', openDrawer = false }: Props) {
  const add = useCart((s) => s.add);
  const { fly, openCart } = useUi();
  const [done, setDone] = useState(false);
  const btn = useRef<HTMLButtonElement>(null);
  const out = product.stock <= 0;

  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (out) return;
    add(toCartItem(product), quantity ?? product.min_qty);
    fly(product.images[0]?.url ?? null, sourceRef?.current ?? btn.current);
    setDone(true);
    setTimeout(() => setDone(false), 1400);
    if (openDrawer) setTimeout(openCart, 800);
  };

  return (
    <button
      ref={btn}
      type="button"
      onClick={onClick}
      disabled={out}
      className={cn('btn-primary relative overflow-hidden', className)}
      aria-label={out ? `${product.name} esgotado` : `${label} ao carrinho: ${product.name}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {done ? (
          <motion.span key="ok" className="flex items-center gap-2" initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -16, opacity: 0 }}>
            <Check className="h-4 w-4" aria-hidden /> Adicionado
          </motion.span>
        ) : (
          <motion.span key="add" className="flex items-center gap-2" initial={{ y: 16, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -16, opacity: 0 }}>
            <ShoppingCart className="h-4 w-4" aria-hidden /> {out ? 'Esgotado' : label}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
