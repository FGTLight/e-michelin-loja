'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ClipboardList, Heart, Menu, Phone, ShoppingCart, Truck, User, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { CategoryIcon } from '@/components/ui/CategoryIcon';
import { site } from '@/config/site';
import { useMounted } from '@/lib/hooks';
import { cn } from '@/lib/utils';
import { useCart } from '@/store/cart';
import { useUi } from '@/store/ui';
import { useWishlist } from '@/store/wishlist';
import type { Category } from '@/types';
import { Logo } from './Logo';
import { MegaMenu } from './MegaMenu';
import { SearchBar } from './SearchBar';

const navLinks = [
  { href: '/produtos?ofertas=1', label: 'Ofertas' },
  { href: '/produtos?ordem=mais-vendidos', label: 'Mais vendidos' },
  { href: '/#calculadora', label: 'Calculadora de materiais' },
  { href: '/orcamento', label: 'Pedir orçamento' },
  { href: '/#contato', label: 'Contato' },
];

export function Header({ categories }: { categories: Category[] }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mounted = useMounted();
  const count = useCart((s) => s.items.length);
  const wishCount = useWishlist((s) => s.items.length);
  const { openCart, cartBump } = useUi();
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 36);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setMobileOpen(false), [pathname]);
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
  }, [mobileOpen]);

  return (
    <header className={cn('sticky -top-9 z-40 bg-white transition-shadow duration-300', scrolled && 'shadow-card')}>
      {/* Barra superior */}
      {/* Barra fixa de 36px (h-9): com o header sticky em -top-9 ela some rolando, sem animar altura */}
      <div id="header-topbar" className="h-9 overflow-hidden bg-petroleo-950 text-petroleo-100">
        <div className="container flex h-9 items-center justify-between gap-4 text-xs">
          <p className="flex items-center gap-2 truncate">
            <Truck className="h-3.5 w-3.5 text-seguranca-400" aria-hidden />
            Entrega rápida em Erechim e região · Retire na loja em até {site.pickupReadyHours}h
          </p>
          <a href={`tel:${site.phoneE164}`} className="hidden items-center gap-1.5 font-semibold text-white hover:text-seguranca-300 sm:flex">
            <Phone className="h-3.5 w-3.5" aria-hidden /> {site.phone}
          </a>
        </div>
      </div>

      {/* Barra principal */}
      <div className="container flex h-16 items-center gap-2 sm:h-[72px] sm:gap-3 lg:gap-8">
        <button
          type="button"
          className="-ml-2 rounded-lg p-2 text-petroleo-950 lg:hidden"
          aria-label="Abrir menu"
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </button>
        <Logo />
        <SearchBar className="hidden flex-1 lg:block" />
        <nav aria-label="Atalhos" className="ml-auto flex shrink-0 items-center gap-0.5 sm:gap-1 lg:ml-0">
          <Link href="/orcamento" className="hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-petroleo-900 hover:bg-petroleo-50 xl:flex">
            <ClipboardList className="h-5 w-5" aria-hidden /> Orçamento
          </Link>
          <Link href="/favoritos" className="relative rounded-lg p-2 text-petroleo-900 hover:bg-petroleo-50 sm:p-2.5" aria-label={`Favoritos${mounted && wishCount ? ` (${wishCount})` : ''}`}>
            <Heart className="h-6 w-6" aria-hidden />
            {mounted && wishCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-petroleo-800 px-1 text-[10px] font-bold text-white">{wishCount}</span>
            )}
          </Link>
          <Link href="/conta" className="hidden rounded-lg p-2.5 text-petroleo-900 hover:bg-petroleo-50 sm:block" aria-label="Minha conta">
            <User className="h-6 w-6" aria-hidden />
          </Link>
          <button
            id="cart-icon"
            type="button"
            onClick={openCart}
            className="relative flex items-center gap-2 rounded-xl bg-petroleo-900 py-2.5 pl-2.5 pr-3 text-white sm:pl-3 sm:pr-4 transition hover:bg-petroleo-800"
            aria-label={`Abrir carrinho${mounted ? ` com ${count} ${count === 1 ? 'item' : 'itens'}` : ''}`}
          >
            <motion.span key={cartBump} animate={cartBump ? { rotate: [0, -14, 10, 0] } : undefined} transition={{ duration: 0.45 }}>
              <ShoppingCart className="h-5 w-5" aria-hidden />
            </motion.span>
            <span className="hidden text-sm font-bold sm:inline">Carrinho</span>
            <motion.span
              key={`c-${cartBump}`}
              initial={cartBump ? { scale: 1.8 } : false}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 12 }}
              className="flex h-5 min-w-5 items-center justify-center rounded-full bg-seguranca-500 px-1.5 text-[11px] font-extrabold text-petroleo-950"
              aria-hidden
            >
              {mounted ? count : 0}
            </motion.span>
          </button>
        </nav>
      </div>

      {/* Busca mobile */}
      <div className="container pb-3 lg:hidden">
        <SearchBar />
      </div>

      {/* Navegação desktop */}
      <div className="hidden border-t border-cimento-200 lg:block">
        <div className="container flex items-center gap-6">
          <MegaMenu categories={categories} />
          <nav aria-label="Principal">
            <ul className="flex items-center gap-1">
              {navLinks.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="relative block px-3 py-3 text-sm font-semibold text-petroleo-900 after:absolute after:inset-x-3 after:bottom-1.5 after:h-0.5 after:origin-left after:scale-x-0 after:bg-seguranca-500 after:transition-transform hover:after:scale-x-100">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Menu mobile */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div className="fixed inset-0 z-50 bg-petroleo-950/60 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setMobileOpen(false)} />
            <motion.aside
              role="dialog"
              aria-modal="true"
              aria-label="Menu"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[86vw] max-w-sm flex-col overflow-y-auto bg-white lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-cimento-200 p-4">
                <Logo />
                <button type="button" onClick={() => setMobileOpen(false)} className="rounded-lg p-2" aria-label="Fechar menu">
                  <X className="h-6 w-6" />
                </button>
              </div>
              <p className="px-4 pb-2 pt-4 text-xs font-bold uppercase tracking-wider text-cimento-600">Categorias</p>
              <ul className="px-2">
                {categories.map((c, i) => (
                  <motion.li key={c.id} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 + i * 0.03 }}>
                    <Link href={`/produtos?categoria=${c.slug}`} className="flex items-center gap-3 rounded-lg px-2 py-2.5 font-semibold text-petroleo-950 hover:bg-petroleo-50">
                      <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-petroleo-900 text-seguranca-400">
                        <CategoryIcon icon={c.icon} className="h-5 w-5" />
                      </span>
                      {c.name}
                    </Link>
                  </motion.li>
                ))}
              </ul>
              <div className="mt-2 border-t border-cimento-200 px-2 py-3">
                {navLinks.map((l) => (
                  <Link key={l.href} href={l.href} className="block rounded-lg px-3 py-2.5 font-semibold text-petroleo-900 hover:bg-petroleo-50">
                    {l.label}
                  </Link>
                ))}
                <Link href="/conta" className="block rounded-lg px-3 py-2.5 font-semibold text-petroleo-900 hover:bg-petroleo-50">
                  Minha conta
                </Link>
              </div>
              <a href={`tel:${site.phoneE164}`} className="btn-dark m-4 mt-auto">
                <Phone className="h-4 w-4" aria-hidden /> {site.phone}
              </a>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
