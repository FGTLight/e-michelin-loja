import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container flex flex-col items-center py-24 text-center">
      <div className="hazard mb-8 h-3 w-40 rounded" aria-hidden />
      <p className="font-display text-7xl font-extrabold text-petroleo-900">404</p>
      <h1 className="mt-2 text-2xl">Página em obras</h1>
      <p className="mt-2 max-w-md text-cimento-700">Não encontramos o que você procurou. Que tal buscar no catálogo ou falar com a nossa equipe?</p>
      <div className="mt-8 flex gap-3">
        <Link href="/produtos" className="btn-primary">Ver produtos</Link>
        <Link href="/" className="btn-outline">Página inicial</Link>
      </div>
    </div>
  );
}
