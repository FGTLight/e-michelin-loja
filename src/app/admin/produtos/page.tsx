import { Plus, Upload } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { getSupabaseServer } from '@/lib/supabase/server';
import { cn, formatBRL, formatQty } from '@/lib/utils';
import type { SaleUnit } from '@/types';

export const metadata = { title: 'Produtos' };

export default async function AdminProducts({ searchParams }: { searchParams: { q?: string; estoque?: string } }) {
  let q = getSupabaseServer()
    .from('products')
    .select('id, sku, name, price, promo_price, stock, min_stock, unit, is_active, category:categories(name), images:product_images(url, sort_order)')
    .order('name')
    .limit(500);
  if (searchParams.q) {
    const term = searchParams.q.replace(/[^\p{L}\p{N} -]/gu, '');
    q = q.or(`name.ilike.%${term}%,sku.ilike.%${term}%`);
  }
  const { data } = await q;
  let products = data ?? [];
  if (searchParams.estoque === 'baixo') products = products.filter((p) => Number(p.stock) <= Number(p.min_stock));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl">Produtos</h1>
        <div className="flex gap-2">
          <Link href="/admin/produtos/importar" className="btn-outline px-4 py-2"><Upload className="h-4 w-4" aria-hidden /> Importar</Link>
          <Link href="/admin/produtos/novo" className="btn-primary px-4 py-2"><Plus className="h-4 w-4" aria-hidden /> Novo produto</Link>
        </div>
      </div>
      <form className="flex flex-wrap gap-2" role="search">
        <label className="sr-only" htmlFor="pq">Buscar produtos</label>
        <input id="pq" name="q" defaultValue={searchParams.q} className="input max-w-sm" placeholder="Nome ou SKU" />
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="estoque" value="baixo" defaultChecked={searchParams.estoque === 'baixo'} className="h-4 w-4" /> Só estoque baixo</label>
        <button className="btn-dark px-4 py-2">Filtrar</button>
      </form>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-cimento-50 text-left text-xs uppercase tracking-wider text-cimento-700">
            <tr><th className="p-3">Produto</th><th className="p-3">SKU</th><th className="p-3">Categoria</th><th className="p-3 text-right">Preço</th><th className="p-3 text-right">Estoque</th><th className="p-3">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-cimento-100">
            {products.map((p) => {
              const low = Number(p.stock) <= Number(p.min_stock);
              const img = [...((p.images as { url: string; sort_order: number }[]) ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0];
              return (
                <tr key={p.id} className="hover:bg-cimento-50">
                  <td className="p-3">
                    <Link href={`/admin/produtos/${p.id}`} className="flex items-center gap-3 font-semibold text-petroleo-900 hover:underline">
                      <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded bg-cimento-100">{img && <Image src={img.url} alt="" fill sizes="40px" className="object-cover" />}</span>
                      {p.name}
                    </Link>
                  </td>
                  <td className="p-3 font-mono text-xs">{p.sku}</td>
                  <td className="p-3 text-cimento-700">{(p.category as unknown as { name: string } | null)?.name}</td>
                  <td className="p-3 text-right">
                    {p.promo_price ? <><s className="text-xs text-cimento-600">{formatBRL(Number(p.price))}</s> <b>{formatBRL(Number(p.promo_price))}</b></> : formatBRL(Number(p.price))}
                  </td>
                  <td className="p-3 text-right">
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-bold', Number(p.stock) === 0 ? 'bg-red-100 text-red-900' : low ? 'bg-amber-100 text-amber-900' : 'bg-emerald-50 text-emerald-900')}>
                      {formatQty(Number(p.stock), p.unit as SaleUnit)}
                    </span>
                  </td>
                  <td className="p-3">{p.is_active ? 'Ativo' : <span className="text-cimento-600">Inativo</span>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
