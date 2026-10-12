import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AdminNav } from '@/components/admin/AdminNav';
import { Logo } from '@/components/layout/Logo';
import { getCurrentProfile } from '@/lib/auth';
import { getSupabaseServer } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';

export const metadata: Metadata = { title: { default: 'Painel', template: '%s | Painel E Michelin' }, robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured()) {
    return (
      <div className="container max-w-xl py-24 text-center">
        <h1 className="text-2xl">Painel indisponível no modo demonstração</h1>
        <p className="mt-2 text-cimento-700">Configure as variáveis do Supabase (veja o README), crie sua conta pelo site e promova-a a administrador.</p>
        <Link href="/" className="btn-primary mt-6">Voltar à loja</Link>
      </div>
    );
  }
  // Defesa em profundidade: o middleware já bloqueia, e as políticas RLS também.
  const profile = await getCurrentProfile();
  if (!profile) redirect('/entrar?next=/admin');
  if (profile.role === 'customer') redirect('/');

  const sb = getSupabaseServer();
  const [{ data: lowStock }, { count: newQuotes }, { count: pendingOrders }] = await Promise.all([
    sb.from('products').select('id, stock, min_stock').eq('is_active', true),
    sb.from('quotes').select('id', { count: 'exact', head: true }).eq('status', 'novo'),
    sb.from('orders').select('id', { count: 'exact', head: true }).in('status', ['pago', 'em_separacao']),
  ]);
  const lowCount = (lowStock ?? []).filter((p) => Number(p.stock) <= Number(p.min_stock)).length;

  return (
    <div className="min-h-dvh bg-cimento-100 lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="bg-petroleo-950 text-petroleo-100 lg:sticky lg:top-0 lg:h-dvh lg:overflow-y-auto">
        <div className="flex items-center justify-between p-5">
          <Logo light />
        </div>
        <AdminNav badges={{ estoque: lowCount, orcamentos: newQuotes ?? 0, pedidos: pendingOrders ?? 0 }} />
        <div className="border-t border-white/10 p-5 text-xs">
          <p className="truncate text-petroleo-200">{profile.email}</p>
          <p className="mt-0.5 font-bold uppercase text-seguranca-400">{profile.role}</p>
          <div className="mt-3 flex gap-3">
            <Link href="/" className="underline">Ver loja</Link>
            <form action="/auth/sair" method="post"><button className="underline">Sair</button></form>
          </div>
        </div>
      </aside>
      <main id="conteudo" className="min-w-0 p-4 sm:p-8">{children}</main>
    </div>
  );
}
