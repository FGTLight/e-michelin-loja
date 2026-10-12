import Link from 'next/link';
import { notFound } from 'next/navigation';
import { OrderSummary } from '@/components/account/OrderSummary';
import { OrderTimeline } from '@/components/account/OrderTimeline';
import { RepeatOrderButton } from '@/components/account/RepeatOrderButton';
import { normalizeOrder } from '@/lib/orders';
import { getSupabaseServer } from '@/lib/supabase/server';
import { formatOrderNumber } from '@/lib/utils';

export default async function AccountOrderPage({ params }: { params: { id: string } }) {
  // RLS garante que o usuário só enxerga os próprios pedidos
  const { data } = await getSupabaseServer()
    .from('orders')
    .select('*, order_items(*), order_status_history(status, note, created_at)')
    .eq('id', params.id)
    .maybeSingle();
  if (!data) notFound();
  const order = normalizeOrder(data);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl">Pedido {formatOrderNumber(order.number)}</h2>
        <div className="flex gap-2">
          {order.status === 'aguardando_pagamento' && (
            <Link href={`/pedido/${order.public_token}`} className="btn-primary px-4 py-2">Pagar agora</Link>
          )}
          <RepeatOrderButton items={(order.order_items ?? []).filter((i) => i.product_id).map((i) => ({ productId: i.product_id!, quantity: i.quantity }))} />
        </div>
      </div>
      <div className="card p-5 sm:p-8">
        <OrderTimeline order={order} />
      </div>
      <OrderSummary order={order} />
    </div>
  );
}
