import { Download } from 'lucide-react';
import Link from 'next/link';
import { getSupabaseServer } from '@/lib/supabase/server';
import { cn, formatBRL, formatDate, formatOrderNumber, orderStatusColors, orderStatusLabels, statusLabelFor } from '@/lib/utils';
import type { DeliveryMethod, OrderStatus } from '@/types';

export const metadata = { title: 'Pedidos' };

export default async function AdminOrders({ searchParams }: { searchParams: { status?: string; q?: string; de?: string; ate?: string } }) {
  const sb = getSupabaseServer();
  let query = sb
    .from('orders')
    .select('id, number, status, total, created_at, delivery_method, payment_method, customer_snapshot, shipping_address')
    .order('created_at', { ascending: false })
    .limit(200);
  if (searchParams.status) query = query.eq('status', searchParams.status);
  if (searchParams.de) query = query.gte('created_at', `${searchParams.de}T00:00:00-03:00`);
  if (searchParams.ate) query = query.lte('created_at', `${searchParams.ate}T23:59:59-03:00`);
  if (searchParams.q) {
    const q = searchParams.q.replace(/[^\p{L}\p{N}@. -]/gu, '');
    query = /^\d+$/.test(q) ? query.eq('number', Number(q)) : query.or(`customer_snapshot->>name.ilike.%${q}%,customer_snapshot->>email.ilike.%${q}%`);
  }
  const { data: orders } = await query;
  const exportParams = new URLSearchParams(Object.entries(searchParams).filter(([, v]) => v) as [string, string][]).toString();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl sm:text-3xl">Pedidos</h1>
        <a href={`/api/admin/pedidos/export?${exportParams}`} className="btn-outline px-4 py-2"><Download className="h-4 w-4" aria-hidden /> Exportar CSV</a>
      </div>

      <form className="card grid gap-3 p-4 sm:grid-cols-5" role="search">
        <label className="sm:col-span-2">
          <span className="label">Buscar</span>
          <input name="q" defaultValue={searchParams.q} className="input" placeholder="Nº do pedido, nome ou e-mail" />
        </label>
        <label>
          <span className="label">Status</span>
          <select name="status" defaultValue={searchParams.status ?? ''} className="input">
            <option value="">Todos</option>
            {Object.entries(orderStatusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label><span className="label">De</span><input type="date" name="de" defaultValue={searchParams.de} className="input" /></label>
        <label><span className="label">Até</span><input type="date" name="ate" defaultValue={searchParams.ate} className="input" /></label>
        <div className="flex gap-2 sm:col-span-5">
          <button className="btn-dark px-4 py-2">Filtrar</button>
          <Link href="/admin/pedidos" className="btn-ghost px-4 py-2">Limpar</Link>
        </div>
      </form>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-cimento-50 text-left text-xs uppercase tracking-wider text-cimento-700">
            <tr><th className="p-3">Pedido</th><th className="p-3">Data</th><th className="p-3">Cliente</th><th className="p-3">Entrega</th><th className="p-3">Status</th><th className="p-3 text-right">Total</th></tr>
          </thead>
          <tbody className="divide-y divide-cimento-100">
            {(orders ?? []).map((o) => {
              const c = o.customer_snapshot as { name: string; company_name?: string };
              return (
                <tr key={o.id} className="hover:bg-cimento-50">
                  <td className="p-3"><Link href={`/admin/pedidos/${o.id}`} className="font-bold text-petroleo-900 underline-offset-2 hover:underline">{formatOrderNumber(o.number)}</Link></td>
                  <td className="p-3 text-cimento-700">{formatDate(o.created_at, true)}</td>
                  <td className="p-3">{c.company_name ?? c.name}</td>
                  <td className="p-3 text-cimento-700">{o.delivery_method === 'retirada' ? 'Retirada' : (o.shipping_address as { city: string } | null)?.city}</td>
                  <td className="p-3"><span className={cn('rounded-full px-2.5 py-0.5 text-xs font-bold', orderStatusColors[o.status as OrderStatus])}>{statusLabelFor(o.status as OrderStatus, o.delivery_method as DeliveryMethod)}</span></td>
                  <td className="p-3 text-right font-semibold">{formatBRL(Number(o.total))}</td>
                </tr>
              );
            })}
            {!orders?.length && <tr><td colSpan={6} className="p-8 text-center text-cimento-600">Nenhum pedido encontrado.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
