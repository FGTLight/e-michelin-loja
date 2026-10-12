import Link from 'next/link';
import { RepeatOrderButton } from '@/components/account/RepeatOrderButton';
import { getCurrentUser } from '@/lib/auth';
import { normalizeOrder } from '@/lib/orders';
import { getSupabaseServer } from '@/lib/supabase/server';
import { cn, formatBRL, formatDate, formatOrderNumber, orderStatusColors, statusLabelFor } from '@/lib/utils';

export default async function OrdersPage() {
  const user = await getCurrentUser();
  const { data } = await getSupabaseServer()
    .from('orders')
    .select('*, order_items(*)')
    .eq('user_id', user!.id)
    .order('created_at', { ascending: false })
    .limit(50);
  const orders = (data ?? []).map(normalizeOrder);

  if (!orders.length) {
    return (
      <div className="card p-10 text-center">
        <p className="font-display text-xl font-bold">Você ainda não fez pedidos</p>
        <Link href="/produtos" className="btn-primary mt-4">Começar a comprar</Link>
      </div>
    );
  }

  return (
    <ul className="space-y-4">
      {orders.map((o) => (
        <li key={o.id} className="card p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <Link href={`/conta/pedidos/${o.id}`} className="font-display text-lg font-bold text-petroleo-950 hover:underline">
                Pedido {formatOrderNumber(o.number)}
              </Link>
              <p className="text-sm text-cimento-700">{formatDate(o.created_at)} · {o.order_items?.length} itens · {formatBRL(o.total)}</p>
            </div>
            <span className={cn('rounded-full px-3 py-1 text-xs font-bold', orderStatusColors[o.status])}>{statusLabelFor(o.status, o.delivery_method)}</span>
          </div>
          <p className="mt-3 line-clamp-1 text-sm text-cimento-700">{o.order_items?.map((i) => i.name).join(' · ')}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href={`/conta/pedidos/${o.id}`} className="btn-outline px-4 py-2">Acompanhar</Link>
            <RepeatOrderButton items={(o.order_items ?? []).filter((i) => i.product_id).map((i) => ({ productId: i.product_id!, quantity: i.quantity }))} />
          </div>
        </li>
      ))}
    </ul>
  );
}
