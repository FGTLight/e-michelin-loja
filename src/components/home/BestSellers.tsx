'use client';

import { motion } from 'framer-motion';
import { ProductCard } from '@/components/product/ProductCard';
import { SectionHeader } from '@/components/ui/SectionHeader';
import type { Product } from '@/types';

export function BestSellers({ products }: { products: Product[] }) {
  return (
    <section className="container py-16 sm:py-20" aria-labelledby="best-title">
      <SectionHeader
        id="best-title"
        eyebrow="Os favoritos da obra"
        title="Mais vendidos"
        description="O que pedreiros, encanadores e construtoras de Erechim mais levam."
        href="/produtos?ordem=mais-vendidos"
        linkLabel="Ver ranking completo"
      />
      <ul className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
        {products.map((p, i) => (
          <motion.li
            key={p.id}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ delay: (i % 4) * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            <ProductCard product={p} />
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
