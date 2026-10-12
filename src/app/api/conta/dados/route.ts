import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { getSupabaseServer } from '@/lib/supabase/server';

/**
 * Direitos do titular (LGPD, art. 18).
 * GET    → portabilidade: exporta os dados da conta em JSON.
 * DELETE → eliminação: anonimiza o cadastro, remove endereços e a conta de acesso.
 *          Pedidos e notas são mantidos pelo prazo legal fiscal (LGPD, art. 16, I).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  const sb = getSupabaseServer();
  const [{ data: profile }, { data: customer }, { data: orders }, { data: quotes }] = await Promise.all([
    sb.from('users').select('email, full_name, created_at').eq('id', user.id).single(),
    sb.from('customers').select('*, addresses(*)').eq('user_id', user.id).maybeSingle(),
    sb.from('orders').select('number, status, total, created_at, customer_snapshot, shipping_address, order_items(name, quantity, unit_price)').eq('user_id', user.id),
    sb.from('quotes').select('number, status, created_at, quote_items(description, quantity)').eq('user_id', user.id),
  ]);
  return new NextResponse(JSON.stringify({ exportedAt: new Date().toISOString(), profile, customer, orders, quotes }, null, 2), {
    headers: { 'Content-Type': 'application/json', 'Content-Disposition': 'attachment; filename="meus-dados-emichelin.json"' },
  });
}

export async function DELETE() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 });
  const db = getSupabaseAdmin();
  const { data: customer } = await db.from('customers').select('id').eq('user_id', user.id).maybeSingle();
  if (customer) {
    await db.from('addresses').delete().eq('customer_id', customer.id);
    await db
      .from('customers')
      .update({ name: 'Titular removido', email: `removido+${customer.id}@invalid`, phone: null, marketing_opt_in: false, user_id: null })
      .eq('id', customer.id);
  }
  await db.auth.admin.deleteUser(user.id);
  await getSupabaseServer().auth.signOut();
  return NextResponse.json({ ok: true });
}
