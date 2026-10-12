import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  await getSupabaseServer().auth.signOut();
  return NextResponse.redirect(new URL('/', req.url), { status: 303 });
}
