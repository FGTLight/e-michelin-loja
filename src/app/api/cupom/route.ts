import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { apiError, clientIp, rateLimit } from '@/lib/api';
import { priceCart, validateCoupon } from '@/lib/orders';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { cartItemsSchema } from '@/lib/validators';

const schema = z.object({ code: z.string().trim().toUpperCase().min(2).max(30), items: cartItemsSchema });

export async function POST(req: NextRequest) {
  if (!rateLimit(`cupom:${clientIp(req)}`, 10)) return NextResponse.json({ error: 'Muitas tentativas. Aguarde um minuto.' }, { status: 429 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: 'Cupons indisponíveis no modo demonstração.' }, { status: 503 });
  try {
    const { code, items } = schema.parse(await req.json());
    const { subtotal } = await priceCart(items);
    const coupon = await validateCoupon(code, subtotal);
    return NextResponse.json({ code: coupon!.code, description: coupon!.description, discount: coupon!.discount, freeShipping: coupon!.freeShipping });
  } catch (e) {
    return apiError(e);
  }
}
