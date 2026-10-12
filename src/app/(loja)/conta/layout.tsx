import { LogOut } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getCurrentProfile } from '@/lib/auth';

export const dynamic = 'force-dynamic';

const links = [
  { href: '/conta', label: 'Meus pedidos' },
  { href: '/conta/enderecos', label: 'Endereços' },
  { href: '/favoritos', label: 'Lista de desejos' },
  { href: '/conta/privacidade', label: 'Dados e privacidade' },
];

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const profile = await getCurrentProfile();
  if (!profile) redirect('/entrar?next=/conta');
  return (
    <div className="container py-8 sm:py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Minha conta</p>
          <h1 className="mt-1 text-3xl">Olá, {profile.full_name?.split(' ')[0] || profile.email}</h1>
        </div>
        <div className="flex gap-2">
          {profile.role !== 'customer' && <Link href="/admin" className="btn-dark px-4 py-2">Painel administrativo</Link>}
          <form action="/auth/sair" method="post">
            <button className="btn-ghost px-4 py-2"><LogOut className="h-4 w-4" aria-hidden /> Sair</button>
          </form>
        </div>
      </div>
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Conta">
          <ul className="flex gap-1 overflow-x-auto lg:flex-col">
            {links.map((l) => (
              <li key={l.href}>
                <Link href={l.href} className="block whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-semibold text-petroleo-900 hover:bg-white hover:shadow-sm">{l.label}</Link>
              </li>
            ))}
          </ul>
        </nav>
        <div>{children}</div>
      </div>
    </div>
  );
}
