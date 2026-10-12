import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { SUPABASE_ANON_KEY, SUPABASE_URL, isSupabaseConfigured } from './env';

/** Renova a sessão do Supabase e protege /conta e /admin. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  if (!isSupabaseConfigured()) return response;

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });

  // getUser() valida o JWT no servidor do Supabase (não confie apenas em getSession()).
  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  if (!user && (path.startsWith('/conta') || path.startsWith('/admin'))) {
    const url = request.nextUrl.clone();
    url.pathname = '/entrar';
    url.search = `?next=${encodeURIComponent(path)}`;
    return NextResponse.redirect(url);
  }

  if (user && path.startsWith('/admin')) {
    const { data } = await supabase.from('users').select('role').eq('id', user.id).single();
    if (!data || !['admin', 'staff'].includes(data.role as string)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  return response;
}
