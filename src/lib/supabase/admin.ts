import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL } from './env';

// Sem tipos gerados do banco: rode `supabase gen types typescript` para tipagem completa.
type Db = SupabaseClient<any, 'public', any>;
let admin: Db | null = null;

/**
 * Cliente com SERVICE ROLE — ignora RLS. Somente no servidor, sempre após validar a entrada com Zod
 * e (quando aplicável) a permissão do usuário. Nunca exponha esta chave ao navegador.
 */
export function getSupabaseAdmin(): Db {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !key) throw new Error('SUPABASE_SERVICE_ROLE_KEY não configurada');
  admin ??= createClient(SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return admin;
}
