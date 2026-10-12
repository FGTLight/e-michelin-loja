import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError } from '@/lib/api';
import { getOrderByToken } from '@/lib/orders';
import { applyPaymentStatus, isSimulatedPayments } from '@/lib/payments';

/** Somente em desenvolvimento sem Mercado Pago: aprova a última cobrança simulada do pedido. */
export async function POST(req: NextRequest) {
  if (!isSimulatedPayments()) return NextResponse.json({ error: 'Não disponível' }, { status: 404 });
  try {
    const { orderToken } = z.object({ orderToken: z.string().uuid() }).parse(await req.json());
    const order = await getOrderByToken(orderToken);
    const payment = order?.payments?.[0];
    if (!order || !payment?.provider_payment_id) return NextResponse.json({ error: 'Gere uma cobrança antes.' }, { status: 400 });
    await applyPaymentStatus(order.id, { id: Number(payment.provider_payment_id), status: 'approved', status_detail: 'accredited' });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return apiError(e);
  }
}
