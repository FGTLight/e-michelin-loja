import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

/** Retorno do link mágico / confirmação de e-mail do Supabase Auth */
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code');
  const next = req.nextUrl.searchParams.get('next') ?? '/conta';
  const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/conta'; // evita open redirect
  if (code) await getSupabaseServer().auth.exchangeCodeForSession(code);
  return NextResponse.redirect(new URL(safeNext, req.url));
}
