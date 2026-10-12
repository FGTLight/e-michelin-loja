import { AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import { SalesChart, TopProductsChart } from '@/components/admin/DashboardCharts';
import { getSupabaseServer } from '@/lib/supabase/server';
import { cn, formatBRL, formatDate, formatOrderNumber, formatQty, orderStatusColors, orderStatusLabels } from '@/lib/utils';
import type { OrderStatus, SaleUnit } from '@/types';

const PAID: OrderStatus[] = ['pago', 'em_separacao', 'saiu_para_entrega', 'entregue'];

/** Início do dia/mês no fuso de Brasília, em ISO */
function brtStart(kind: 'day' | 'month' | 'days30') {
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }));
  const d = new Date(now);
  if (kind === 'month') d.setDate(1);
  if (kind === 'days30') d.setDate(d.getDate() - 29);
  d.setHours(0, 0, 0, 0);
  return new Date(d.getTime() + 3 * 3_600_000).toISOString(); // BRT = UTC-3
}

export default async function Dashboard() {
  const sb = getSupabaseServer();
  const since = [brtStart('days30'), brtStart('month')].sort()[0];
  const [{ data: orders }, { data: products }, { data: recent }] = await Promise.all([
    sb.from('orders').select('id, total, status, created_at, paid_at, order_items(name, total)').gte('created_at', since).in('status', PAID),
    sb.from('products').select('id, name, sku, stock, min_stock, unit').eq('is_active', true),
    sb.from('orders').select('id, number, total, status, created_at, customer_snapshot').order('created_at', { ascending: false }).limit(8),
  ]);

  const dayStart = brtStart('day');
  const monthStart = brtStart('month');
  const paid = (orders ?? []).map((o) => ({ ...o, total: Number(o.total), at: (o.paid_at ?? o.created_at) as string }));
  const today = paid.filter((o) => o.at >= dayStart);
  const month = paid.filter((o) => o.at >= monthStart);
  const sum = (l: { total: number }[]) => l.reduce((s, o) => s + o.total, 0);
  const avgTicket = month.length ? sum(month) / month.length : 0;

  // Série diária de 30 dias (dias sem venda = 0)
  const days = Array.from({ length: 30 }, (_, i) => {
    const d = new Date(Date.now() - (29 - i) * 86_400_000);
    return d.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' });
  });
  const byDay = new Map(days.map((d) => [d, 0]));
  paid.forEach((o) => {
    const key = new Date(o.at).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo', day: '2-digit', month: '2-digit' });
    if (byDay.has(key)) byDay.set(key, byDay.get(key)! + o.total);
  });

  const productTotals = new Map<string, number>();
  month.forEach((o) => (o.order_items as { name: string; total: number }[]).forEach((i) => productTotals.set(i.name, (productTotals.get(i.name) ?? 0) + Number(i.total))));
  const top = [...productTotals.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, total]) => ({ name, total }));

  const low = (products ?? []).filter((p) => Number(p.stock) <= Number(p.min_stock)).sort((a, b) => Number(a.stock) - Number(b.stock));

  const kpis = [
    { label: 'Vendas hoje', value: formatBRL(sum(today)), sub: `${today.length} pedidos pagos` },
    { label: 'Vendas no mês', value: formatBRL(sum(month)), sub: `${month.length} pedidos pagos` },
    { label: 'Ticket médio (mês)', value: formatBRL(avgTicket), sub: 'por pedido pago' },
    { label: 'Estoque baixo', value: String(low.length), sub: 'produtos no mínimo ou abaixo', alert: low.length > 0 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl">Dashboard</h1>

      <dl className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className={cn('card p-5', k.alert && 'ring-2 ring-seguranca-400')}>
            <dt className="text-sm text-cimento-700">{k.label}</dt>
            <dd className="mt-1 font-display text-2xl font-extrabold text-petroleo-950 sm:text-3xl">{k.value}</dd>
            <dd className="text-xs text-cimento-600">{k.sub}</dd>
          </div>
        ))}
      </dl>

      <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
        <section className="card p-5" aria-labelledby="sales-title">
          <h2 id="sales-title" className="mb-4 text-lg">Faturamento — últimos 30 dias</h2>
          <SalesChart data={days.map((d) => ({ day: d, total: Math.round(byDay.get(d)! * 100) / 100 }))} />
        </section>
        <section className="card p-5" aria-labelledby="top-title">
          <h2 id="top-title" className="mb-4 text-lg">Mais vendidos do mês (R$)</h2>
          {top.length ? <TopProductsChart data={top} /> : <p className="text-sm text-cimento-600">Sem vendas pagas neste mês ainda.</p>}
        </section>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="card p-5" aria-labelledby="low-title">
          <h2 id="low-title" className="mb-4 flex items-center gap-2 text-lg"><AlertTriangle className="h-5 w-5 text-seguranca-600" aria-hidden /> Alertas de estoque baixo</h2>
          {low.length ? (
            <ul className="divide-y divide-cimento-100 text-sm">
              {low.slice(0, 10).map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3 py-2.5">
                  <Link href={`/admin/produtos/${p.id}`} className="font-semibold text-petroleo-900 hover:underline">{p.name}</Link>
                  <span className={cn('whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-bold', Number(p.stock) === 0 ? 'bg-red-100 text-red-900' : 'bg-amber-100 text-amber-900')}>
                    {formatQty(Number(p.stock), p.unit as SaleUnit)} · mín. {Number(p.min_stock)}
                  </span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-cimento-600">Nenhum produto abaixo do estoque mínimo.</p>}
        </section>
        <section className="card p-5" aria-labelledby="recent-title">
          <div className="mb-4 flex items-center justify-between">
            <h2 id="recent-title" className="text-lg">Pedidos recentes</h2>
            <Link href="/admin/pedidos" className="text-sm font-semibold text-petroleo-800 underline">Ver todos</Link>
          </div>
          <ul className="divide-y divide-cimento-100 text-sm">
            {(recent ?? []).map((o) => (
              <li key={o.id}>
                <Link href={`/admin/pedidos/${o.id}`} className="flex items-center gap-3 py-2.5 hover:bg-cimento-50">
                  <span className="font-bold text-petroleo-950">{formatOrderNumber(o.number)}</span>
                  <span className="flex-1 truncate text-cimento-700">{(o.customer_snapshot as { name: string }).name} · {formatDate(o.created_at)}</span>
                  <span className={cn('rounded-full px-2 py-0.5 text-[11px] font-bold', orderStatusColors[o.status as OrderStatus])}>{orderStatusLabels[o.status as OrderStatus]}</span>
                  <span className="w-24 text-right font-semibold">{formatBRL(Number(o.total))}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
