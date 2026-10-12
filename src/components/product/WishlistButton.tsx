'use client';

import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useMounted } from '@/lib/hooks';
import { cn, effectivePrice } from '@/lib/utils';
import { useWishlist } from '@/store/wishlist';
import type { Product } from '@/types';

export function WishlistButton({ product, className }: { product: Product; className?: string }) {
  const mounted = useMounted();
  const active = useWishlist((s) => s.items.some((i) => i.productId === product.id));
  const toggle = useWishlist((s) => s.toggle);
  const on = mounted && active;

  return (
    <motion.button
      type="button"
      whileTap={{ scale: 0.8 }}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle({ productId: product.id, slug: product.slug, name: product.name, image: product.images[0]?.url ?? null, price: effectivePrice(product) });
      }}
      aria-pressed={on}
      aria-label={on ? `Remover ${product.name} dos favoritos` : `Adicionar ${product.name} aos favoritos`}
      className={cn('flex h-9 w-9 items-center justify-center rounded-full bg-white/95 text-petroleo-900 shadow-sm ring-1 ring-cimento-200 transition hover:text-red-600', className)}
    >
      <motion.span key={String(on)} initial={{ scale: on ? 0.4 : 1 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 12 }}>
        <Heart className={cn('h-4 w-4', on && 'fill-red-600 text-red-600')} />
      </motion.span>
    </motion.button>
  );
}
