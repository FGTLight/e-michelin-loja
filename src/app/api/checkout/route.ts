import { NextResponse, type NextRequest } from 'next/server';
import { apiError, clientIp, rateLimit } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { notifyOrderCreated } from '@/lib/notifications';
import { createOrder } from '@/lib/orders';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { checkoutSchema } from '@/lib/validators';

/**
 * Cria o pedido (status "aguardando pagamento").
 * Preços, frete, cupom e estoque são recalculados no servidor; o estoque é reservado de forma atômica.
 */
export async function POST(req: NextRequest) {
  if (!rateLimit(`checkout:${clientIp(req)}`, 8)) {
    return NextResponse.json({ error: 'Muitas tentativas seguidas. Aguarde um minuto.' }, { status: 429 });
  }
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Modo demonstração: configure o Supabase (veja o README) para finalizar pedidos.' }, { status: 503 });
  }
  try {
    const input = checkoutSchema.parse(await req.json());
    const user = await getCurrentUser();
    const order = await createOrder(input, user?.id ?? null);
    notifyOrderCreated(order).catch((e) => console.error('[notify]', e));
    return NextResponse.json({ token: order.public_token, number: order.number, total: order.total }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
