import Link from 'next/link';
import { getSupabaseServer } from '@/lib/supabase/server';
import { cn, formatBRL, formatDate } from '@/lib/utils';

export const metadata = { title: 'Orçamentos' };

const statusStyle: Record<string, string> = {
  novo: 'bg-seguranca-100 text-seguranca-900',
  em_analise: 'bg-sky-100 text-sky-900',
  respondido: 'bg-indigo-100 text-indigo-900',
  convertido: 'bg-emerald-100 text-emerald-900',
  recusado: 'bg-red-100 text-red-900',
  expirado: 'bg-cimento-200 text-cimento-800',
};

export default async function AdminQuotes({ searchParams }: { searchParams: { status?: string } }) {
  let q = getSupabaseServer().from('quotes').select('id, number, name, company_name, city, status, total, created_at, quote_items(count)').order('created_at', { ascending: false }).limit(200);
  if (searchParams.status) q = q.eq('status', searchParams.status);
  const { data } = await q;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl">Orçamentos</h1>
      <nav className="flex flex-wrap gap-2" aria-label="Filtrar por status">
        {['', 'novo', 'em_analise', 'respondido', 'convertido', 'recusado'].map((s) => (
          <Link key={s} href={s ? `/admin/orcamentos?status=${s}` : '/admin/orcamentos'} className={cn('rounded-full px-3 py-1.5 text-sm font-semibold', (searchParams.status ?? '') === s ? 'bg-petroleo-900 text-white' : 'bg-white text-petroleo-900 ring-1 ring-cimento-200')}>
            {s ? s.replace('_', ' ') : 'Todos'}
          </Link>
        ))}
      </nav>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="bg-cimento-50 text-left text-xs uppercase tracking-wider text-cimento-700">
            <tr><th className="p-3">Nº</th><th className="p-3">Data</th><th className="p-3">Cliente</th><th className="p-3">Cidade</th><th className="p-3">Itens</th><th className="p-3">Status</th><th className="p-3 text-right">Total</th></tr>
          </thead>
          <tbody className="divide-y divide-cimento-100">
            {(data ?? []).map((q) => (
              <tr key={q.id} className="hover:bg-cimento-50">
                <td className="p-3"><Link href={`/admin/orcamentos/${q.id}`} className="font-bold text-petroleo-900 hover:underline">#{q.number}</Link></td>
                <td className="p-3 text-cimento-700">{formatDate(q.created_at, true)}</td>
                <td className="p-3">{q.company_name ?? q.name}</td>
                <td className="p-3 text-cimento-700">{q.city}</td>
                <td className="p-3">{(q.quote_items as unknown as { count: number }[])[0]?.count ?? 0}</td>
                <td className="p-3"><span className={cn('rounded-full px-2.5 py-0.5 text-xs font-bold', statusStyle[q.status])}>{q.status.replace('_', ' ')}</span></td>
                <td className="p-3 text-right font-semibold">{q.total ? formatBRL(Number(q.total)) : '—'}</td>
              </tr>
            ))}
            {!data?.length && <tr><td colSpan={7} className="p-8 text-center text-cimento-600">Nenhum orçamento.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
