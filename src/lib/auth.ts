import 'server-only';
import { NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';

export async function getCurrentUser() {
  if (!isSupabaseConfigured()) return null;
  const sb = getSupabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  return user;
}

export async function getCurrentProfile() {
  const user = await getCurrentUser();
  if (!user) return null;
  const { data } = await getSupabaseServer().from('users').select('id, email, full_name, role').eq('id', user.id).single();
  return data as { id: string; email: string; full_name: string | null; role: 'customer' | 'staff' | 'admin' } | null;
}

/** Para Route Handlers do painel: retorna o perfil ou uma resposta 401/403 pronta. */
export async function requireAdmin() {
  const profile = await getCurrentProfile();
  if (!profile) return { error: NextResponse.json({ error: 'Não autenticado' }, { status: 401 }) } as const;
  if (profile.role !== 'admin' && profile.role !== 'staff') {
    return { error: NextResponse.json({ error: 'Acesso negado' }, { status: 403 }) } as const;
  }
  return { profile } as const;
}
