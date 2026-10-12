import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { isSupabaseConfigured } from '@/lib/supabase/env';

/** Status público do pedido (o token é um UUID aleatório, impossível de adivinhar). */
export async function GET(_: Request, { params }: { params: { token: string } }) {
  if (!isSupabaseConfigured() || !z.string().uuid().safeParse(params.token).success) {
    return NextResponse.json({ error: 'not found' }, { status: 404 });
  }
  const { data } = await getSupabaseAdmin().from('orders').select('status').eq('public_token', params.token).maybeSingle();
  if (!data) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json({ status: data.status }, { headers: { 'Cache-Control': 'no-store' } });
}
