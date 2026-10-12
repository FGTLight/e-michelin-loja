import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function SectionHeader({
  id,
  eyebrow,
  title,
  description,
  href,
  linkLabel,
  children,
}: {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h2 id={id} className="section-title mt-2">
          {title}
        </h2>
        {description && <p className="mt-2 text-cimento-700">{description}</p>}
      </div>
      {children}
      {href && (
        <Link href={href} className="group inline-flex items-center gap-1.5 text-sm font-bold text-petroleo-800 hover:text-petroleo-950">
          {linkLabel}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
        </Link>
      )}
    </div>
  );
}
