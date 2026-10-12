import { NextResponse, type NextRequest } from 'next/server';
import { getPayment, verifyWebhookSignature } from '@/lib/mercadopago';
import { applyPaymentStatus } from '@/lib/payments';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * Webhook do Mercado Pago.
 * 1. Verifica a assinatura HMAC (x-signature) — notificações sem assinatura válida são rejeitadas.
 * 2. Nunca confia no corpo: consulta o pagamento na API do MP pelo ID.
 * 3. Atualiza pagamento/pedido de forma idempotente (o MP reenvia notificações).
 */
export async function POST(req: NextRequest) {
  const url = req.nextUrl;
  const body = (await req.json().catch(() => ({}))) as { type?: string; action?: string; data?: { id?: string | number } };
  const dataId = url.searchParams.get('data.id') ?? (body.data?.id != null ? String(body.data.id) : null);
  const type = url.searchParams.get('type') ?? body.type;

  const valid = verifyWebhookSignature({
    xSignature: req.headers.get('x-signature'),
    xRequestId: req.headers.get('x-request-id'),
    dataId,
  });
  if (!valid) return NextResponse.json({ error: 'assinatura inválida' }, { status: 401 });
  if (type !== 'payment' || !dataId) return NextResponse.json({ ignored: true });

  try {
    const payment = await getPayment(dataId);
    const db = getSupabaseAdmin();
    const { data: order } = await db.from('orders').select('id, total').eq('id', payment.external_reference).maybeSingle();
    if (!order) return NextResponse.json({ ignored: 'pedido não encontrado' });

    // Valor pago precisa bater com o total do pedido
    if (Math.abs(Number(order.total) - payment.transaction_amount) > 0.01) {
      console.error('[webhook] valor divergente', payment.id, payment.transaction_amount, order.total);
      return NextResponse.json({ error: 'valor divergente' }, { status: 409 });
    }

    // Garante o registro do pagamento mesmo que a criação local tenha falhado
    await db.from('payments').upsert(
      {
        order_id: order.id,
        provider_payment_id: String(payment.id),
        method: payment.payment_method_id === 'pix' ? 'pix' : payment.payment_method_id?.startsWith('bol') ? 'boleto' : 'cartao',
        status: payment.status,
        status_detail: payment.status_detail,
        amount: payment.transaction_amount,
        installments: payment.installments ?? 1,
      },
      { onConflict: 'provider_payment_id', ignoreDuplicates: true },
    );
    await applyPaymentStatus(order.id, payment);
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[webhook]', e);
    // 500 faz o Mercado Pago tentar de novo mais tarde
    return NextResponse.json({ error: 'erro ao processar' }, { status: 500 });
  }
}
