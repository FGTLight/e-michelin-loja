import { NextResponse, type NextRequest } from 'next/server';
import { apiError, clientIp, rateLimit } from '@/lib/api';
import { getDeliveryZones, getProductsByIds } from '@/lib/data';
import { lookupCep, quoteShipping } from '@/lib/shipping';
import { effectivePrice, normalizeQty, round2 } from '@/lib/utils';
import { shippingQuoteSchema } from '@/lib/validators';

/**
 * Cotação de frete por CEP + peso. A cidade vem do ViaCEP (servidor) e peso/preço do banco —
 * nada que o navegador envie além de IDs e quantidades é usado no cálculo.
 */
export async function POST(req: NextRequest) {
  if (!rateLimit(`frete:${clientIp(req)}`, 30)) return NextResponse.json({ error: 'Muitas consultas. Aguarde um instante.' }, { status: 429 });
  try {
    const input = shippingQuoteSchema.parse(await req.json());
    // CEP desconhecido no ViaCEP: usa a cidade digitada pelo cliente (se houver); a retirada é sempre oferecida
    const address = (await lookupCep(input.cep)) ?? (input.city && input.state ? { cep: input.cep, street: '', district: '', city: input.city, state: input.state.toUpperCase(), complement: '' } : null);
    if (!address) return NextResponse.json({ error: 'CEP não encontrado.' }, { status: 404 });

    const products = await getProductsByIds(input.items.map((i) => i.productId));
    let subtotal = 0;
    let weightKg = 0;
    for (const item of input.items) {
      const p = products.find((x) => x.id === item.productId);
      if (!p) continue;
      const qty = normalizeQty(item.quantity, p.min_qty, p.qty_step);
      subtotal += effectivePrice(p) * qty;
      weightKg += p.weight_kg * qty;
    }

    const { options, outOfArea } = quoteShipping({
      zones: await getDeliveryZones(),
      city: address.city,
      state: address.state,
      subtotal: round2(subtotal),
      weightKg: round2(weightKg),
    });
    return NextResponse.json({ address, options, outOfArea, subtotal: round2(subtotal), weightKg: round2(weightKg) });
  } catch (e) {
    return apiError(e);
  }
}
