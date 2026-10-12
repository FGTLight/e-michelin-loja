import { NextResponse, type NextRequest } from 'next/server';
import { apiError, clientIp, rateLimit } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { notifyQuoteReceived } from '@/lib/notifications';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { quoteRequestSchema } from '@/lib/validators';

/** Recebe uma lista de obra e cria a solicitação de orçamento (notifica loja e cliente por e-mail/WhatsApp). */
export async function POST(req: NextRequest) {
  if (!rateLimit(`quote:${clientIp(req)}`, 5, 10 * 60_000)) {
    return NextResponse.json({ error: 'Você já enviou várias solicitações. Tente novamente em alguns minutos.' }, { status: 429 });
  }
  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Modo demonstração: configure o Supabase para receber orçamentos.' }, { status: 503 });
  }
  try {
    const input = quoteRequestSchema.parse(await req.json());
    if (input.website) return NextResponse.json({ ok: true }); // honeypot: bots preenchem o campo oculto

    const db = getSupabaseAdmin();
    const user = await getCurrentUser();

    // Só aceita IDs de produtos que existem; o resto vira item avulso (texto livre)
    const ids = input.items.map((i) => i.productId).filter(Boolean) as string[];
    const { data: products } = ids.length ? await db.from('products').select('id, sku').in('id', ids) : { data: [] };
    const known = new Map((products ?? []).map((p) => [p.id as string, p.sku as string]));

    const { data: quote, error } = await db
      .from('quotes')
      .insert({
        user_id: user?.id ?? null,
        person_type: input.personType,
        name: input.name,
        email: input.email,
        phone: input.phone,
        document: input.document || null,
        company_name: input.companyName || null,
        city: input.city || null,
        project_description: input.projectDescription || null,
        lgpd_consent_at: new Date().toISOString(),
      })
      .select('id, number, public_token')
      .single();
    if (error) throw error;

    const { error: itemsError } = await db.from('quote_items').insert(
      input.items.map((i) => ({
        quote_id: quote.id,
        product_id: i.productId && known.has(i.productId) ? i.productId : null,
        sku: i.productId ? known.get(i.productId) ?? null : null,
        description: i.description,
        unit: i.unit,
        quantity: i.quantity,
      })),
    );
    if (itemsError) throw itemsError;

    notifyQuoteReceived({ ...quote, name: input.name, email: input.email, phone: input.phone, city: input.city, project_description: input.projectDescription, items: input.items }).catch((e) =>
      console.error('[notify]', e),
    );
    return NextResponse.json({ number: quote.number, token: quote.public_token }, { status: 201 });
  } catch (e) {
    return apiError(e);
  }
}
