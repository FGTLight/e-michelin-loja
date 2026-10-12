import { NextResponse, type NextRequest } from 'next/server';
import { apiError } from '@/lib/api';
import { requireAdmin } from '@/lib/auth';
import { notifyQuoteAnswered } from '@/lib/notifications';
import { OrderError } from '@/lib/orders';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { onlyDigits, round2 } from '@/lib/utils';
import { quoteResponseSchema } from '@/lib/validators';

/**
 * Responde, recusa ou converte um orçamento em pedido.
 * A conversão usa os preços negociados, reserva o estoque dos itens de catálogo
 * e envia ao cliente o link de pagamento (/pedido/[token]).
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ('error' in auth) return auth.error;
  try {
    const input = quoteResponseSchema.parse(await req.json());
    const db = getSupabaseAdmin();
    const { data: quote } = await db.from('quotes').select('*, quote_items(*)').eq('id', params.id).single();
    if (!quote) return NextResponse.json({ error: 'Orçamento não encontrado' }, { status: 404 });
    if (['convertido', 'recusado'].includes(quote.status)) throw new OrderError('Este orçamento já foi finalizado.', 409);

    if (input.action === 'recusar') {
      await db.from('quotes').update({ status: 'recusado', admin_notes: input.admin_notes || null }).eq('id', quote.id);
      return NextResponse.json({ ok: true });
    }

    type QI = { id: string; product_id: string | null; sku: string | null; description: string; unit: string; quantity: number };
    const items = (quote.quote_items as QI[]).map((i) => ({ ...i, quantity: Number(i.quantity), unit_price: input.items.find((p) => p.id === i.id)?.unit_price ?? 0 }));
    if (items.some((i) => i.unit_price <= 0)) throw new OrderError('Informe o preço de todos os itens.');

    await Promise.all(items.map((i) => db.from('quote_items').update({ unit_price: i.unit_price }).eq('id', i.id)));
    const subtotal = round2(items.reduce((s, i) => s + i.unit_price * i.quantity, 0));
    const total = round2(Math.max(0, subtotal - input.discount) + input.shipping_cost);
    const base = {
      discount: input.discount, shipping_cost: input.shipping_cost, total, valid_until: input.valid_until,
      response_message: input.response_message || null, admin_notes: input.admin_notes || null, responded_at: new Date().toISOString(),
    };

    if (input.action === 'responder') {
      await db.from('quotes').update({ ...base, status: 'respondido' }).eq('id', quote.id);
      notifyQuoteAnswered({ ...quote, ...base }).catch((e) => console.error('[notify]', e));
      return NextResponse.json({ ok: true, total });
    }

    // ---- converter em pedido
    const doc = onlyDigits(quote.document ?? '');
    const { data: order, error } = await db
      .from('orders')
      .insert({
        user_id: quote.user_id,
        quote_id: quote.id,
        delivery_method: input.shipping_cost > 0 ? 'entrega' : 'retirada',
        shipping_address: null,
        customer_snapshot: {
          name: quote.name, email: quote.email, phone: quote.phone, person_type: quote.person_type,
          document: doc, company_name: quote.company_name,
        },
        subtotal, discount: input.discount, shipping_cost: input.shipping_cost, total,
        notes: `Gerado do orçamento #${quote.number}. ${input.response_message}`.trim(),
      })
      .select('id, public_token')
      .single();
    if (error) throw error;

    await db.from('order_items').insert(
      items.map((i) => ({ order_id: order.id, product_id: i.product_id, sku: i.sku ?? 'AVULSO', name: i.description, unit: i.unit, unit_price: i.unit_price, quantity: i.quantity })),
    );
    const catalog = items.filter((i) => i.product_id).map((i) => ({ product_id: i.product_id, quantity: i.quantity }));
    if (catalog.length) {
      const { error: stockError } = await db.rpc('reserve_stock', { p_items: catalog });
      if (stockError) {
        await db.from('orders').delete().eq('id', order.id);
        throw new OrderError('Estoque insuficiente para algum item do catálogo. Ajuste as quantidades ou o estoque.', 409);
      }
    }

    await db.from('quotes').update({ ...base, status: 'convertido', converted_order_id: order.id }).eq('id', quote.id);
    notifyQuoteAnswered({ ...quote, ...base }, order.public_token).catch((e) => console.error('[notify]', e));
    return NextResponse.json({ ok: true, orderId: order.id });
  } catch (e) {
    return apiError(e);
  }
}
