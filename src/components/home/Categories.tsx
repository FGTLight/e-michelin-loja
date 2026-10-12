'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { SectionHeader } from '@/components/ui/SectionHeader';
import type { Category } from '@/types';

const MotionLink = motion.create(Link);

export function Categories({ categories }: { categories: Category[] }) {
  return (
    <section className="container py-16 sm:py-20" aria-labelledby="cat-title">
      <SectionHeader id="cat-title" eyebrow="Departamentos" title="Compre por categoria" href="/produtos" linkLabel="Ver todos os produtos" />
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {categories.map((c, i) => (
          <motion.li
            key={c.id}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-60px' }}
            transition={{ delay: (i % 4) * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          >
            <MotionLink
              href={`/produtos?categoria=${c.slug}`}
              initial="rest"
              animate="rest"
              whileHover="hover"
              whileFocus="hover"
              className="group flex h-full flex-col items-start gap-4 rounded-2xl bg-white p-5 shadow-card ring-1 ring-cimento-200/60 transition-colors duration-300 hover:bg-petroleo-900 focus-visible:bg-petroleo-900 sm:p-6"
            >
              <motion.span
                variants={{ rest: { y: 0 }, hover: { y: -4 } }}
                className="flex h-14 w-14 items-center justify-center rounded-2xl bg-seguranca-100 text-seguranca-800 transition-colors duration-300 group-hover:bg-seguranca-500 group-hover:text-petroleo-950"
              >
                <CategoryIcon icon={c.icon} className="h-8 w-8" />
              </motion.span>
              <span>
                <span className="block font-display text-base font-bold text-petroleo-950 transition-colors group-hover:text-white sm:text-lg">{c.name}</span>
                <span className="mt-1 line-clamp-2 hidden text-xs text-cimento-700 transition-colors group-hover:text-petroleo-100 sm:block">{c.description}</span>
              </span>
            </MotionLink>
          </motion.li>
        ))}
      </ul>
    </section>
  );
}
