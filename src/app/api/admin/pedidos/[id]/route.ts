import { NextResponse, type NextRequest } from 'next/server';
import { apiError } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { notifyOrderStatus } from '@/lib/notifications';
import { getOrderById } from '@/lib/orders';
import { getSupabaseServer } from '@/lib/supabase/server';
import { orderStatusUpdateSchema } from '@/lib/validators';

/** Muda o status do pedido. Usa a sessão do admin (RLS) para o histórico registrar quem alterou. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  try {
    const { status, note, notify } = orderStatusUpdateSchema.parse(await req.json());
    const sb = getSupabaseServer();
    const { data: current } = await sb.from('orders').select('status').eq('id', params.id).single();
    if (!current) return NextResponse.json({ error: 'Pedido não encontrado' }, { status: 404 });
    if (current.status === 'cancelado') return NextResponse.json({ error: 'Pedido cancelado não pode ser reaberto.' }, { status: 409 });

    const { error } = await sb.from('orders').update({ status }).eq('id', params.id);
    if (error) throw error;
    if (note) await sb.from('order_status_history').update({ note }).eq('order_id', params.id).eq('status', status).is('note', null);

    if (notify) {
      const order = await getOrderById(params.id);
      if (order) notifyOrderStatus(order, note).catch((e) => console.error('[notify]', e));
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
