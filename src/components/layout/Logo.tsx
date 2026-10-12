import Link from 'next/link';

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link href="/" className="group flex shrink-0 items-center gap-2.5" aria-label="E Michelin e Cia — página inicial">
      <svg viewBox="0 0 64 64" className="h-9 w-9 shrink-0 transition-transform sm:h-10 sm:w-10 duration-300 group-hover:-rotate-6" aria-hidden="true">
        <rect width="64" height="64" rx="14" fill={light ? '#ffffff' : '#123848'} />
        <path d="M12 34 32 16l20 18v16H12z" fill="#ff7210" />
        <path d="M26 50V38h12v12" fill={light ? '#ffffff' : '#123848'} />
        <rect x="12" y="52" width="40" height="4" fill="#ff7210" />
      </svg>
      <span className="leading-none">
        <span className={`block whitespace-nowrap font-display text-base font-extrabold tracking-tight sm:text-lg ${light ? 'text-white' : 'text-petroleo-950'}`}>
          E Michelin <span className={light ? 'text-seguranca-400' : 'text-seguranca-700'}>e Cia</span>
        </span>
        <span className={`hidden text-[11px] font-semibold uppercase tracking-[.18em] sm:block ${light ? 'text-petroleo-100' : 'text-cimento-600'}`}>
          Materiais de construção
        </span>
      </span>
    </Link>
  );
}
