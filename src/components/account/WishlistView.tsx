'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Heart, Trash2 } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useMounted } from '@/lib/hooks';
import { formatBRL } from '@/lib/utils';
import { useWishlist } from '@/store/wishlist';

export function WishlistView() {
  const mounted = useMounted();
  const { items, remove } = useWishlist();
  if (!mounted) return <div className="skeleton h-64" />;
  if (!items.length) {
    return (
      <div className="card flex flex-col items-center gap-3 p-12 text-center">
        <Heart className="h-12 w-12 text-cimento-400" aria-hidden />
        <p className="font-display text-xl font-bold">Nenhum favorito ainda</p>
        <p className="text-sm text-cimento-700">Toque no coração dos produtos para salvá-los aqui.</p>
        <Link href="/produtos" className="btn-primary mt-2">Explorar produtos</Link>
      </div>
    );
  }
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <AnimatePresence mode="popLayout">
        {items.map((i) => (
          <motion.li key={i.productId} layout exit={{ opacity: 0, scale: 0.9 }} className="card flex gap-4 p-4">
            <Link href={`/produto/${i.slug}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-cimento-100">
              {i.image && <Image src={i.image} alt="" fill sizes="96px" className="object-cover" />}
            </Link>
            <div className="flex min-w-0 flex-1 flex-col">
              <Link href={`/produto/${i.slug}`} className="line-clamp-2 text-sm font-semibold text-petroleo-950 hover:underline">{i.name}</Link>
              <p className="mt-1 text-xs text-cimento-600">Preço quando salvo: {formatBRL(i.price)}</p>
              <div className="mt-auto flex gap-2 pt-2">
                <Link href={`/produto/${i.slug}`} className="btn-primary flex-1 px-3 py-2 text-xs">Ver produto</Link>
                <button type="button" onClick={() => remove(i.productId)} className="btn-ghost px-3 py-2" aria-label={`Remover ${i.name} dos favoritos`}><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </motion.li>
        ))}
      </AnimatePresence>
    </ul>
  );
}
