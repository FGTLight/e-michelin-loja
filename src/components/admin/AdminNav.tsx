'use client';

import { BadgePercent, ClipboardList, FolderTree, Image as ImageIcon, LayoutDashboard, Package, Tags, Truck, Upload, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const items = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/pedidos', label: 'Pedidos', icon: ShoppingBag, badge: 'pedidos' },
  { href: '/admin/orcamentos', label: 'Orçamentos', icon: ClipboardList, badge: 'orcamentos' },
  { href: '/admin/produtos', label: 'Produtos', icon: Package, badge: 'estoque' },
  { href: '/admin/produtos/importar', label: 'Importar CSV/Excel', icon: Upload },
  { href: '/admin/recursos/categorias', label: 'Categorias', icon: FolderTree },
  { href: '/admin/recursos/marcas', label: 'Marcas', icon: Tags },
  { href: '/admin/recursos/cupons', label: 'Cupons', icon: BadgePercent },
  { href: '/admin/recursos/banners', label: 'Banners de ofertas', icon: ImageIcon },
  { href: '/admin/recursos/entregas', label: 'Zonas de entrega', icon: Truck },
] as const;

export function AdminNav({ badges }: { badges: Record<string, number> }) {
  const path = usePathname();
  return (
    <nav aria-label="Painel" className="px-3 pb-4">
      <ul className="flex gap-1 overflow-x-auto lg:flex-col">
        {items.map((i) => {
          const active = 'exact' in i ? path === i.href : path.startsWith(i.href) && !(i.href === '/admin/produtos' && path.startsWith('/admin/produtos/importar'));
          const badge = 'badge' in i ? badges[i.badge] : 0;
          return (
            <li key={i.href}>
              <Link
                href={i.href}
                aria-current={active ? 'page' : undefined}
                className={cn('flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2.5 text-sm font-semibold transition', active ? 'bg-seguranca-500 text-petroleo-950' : 'hover:bg-white/10')}
              >
                <i.icon className="h-4 w-4" aria-hidden />
                <span className="flex-1">{i.label}</span>
                {badge > 0 && (
                  <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold', active ? 'bg-petroleo-950 text-white' : 'bg-seguranca-500 text-petroleo-950')} title={'badge' in i && i.badge === 'estoque' ? 'Produtos com estoque baixo' : undefined}>
                    {badge}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
