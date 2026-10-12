'use client';

import { Minus, Plus } from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn, formatNumber, normalizeQty, unitLabels } from '@/lib/utils';
import type { SaleUnit } from '@/types';

interface Props {
  value: number;
  onChange: (v: number) => void;
  min: number;
  step: number;
  max: number;
  unit: SaleUnit;
  size?: 'sm' | 'md';
  label?: string;
}

/** Seletor de quantidade que respeita mínimo, múltiplo de venda e estoque. */
export function QuantitySelector({ value, onChange, min, step, max, unit, size = 'md', label = 'Quantidade' }: Props) {
  const [draft, setDraft] = useState(String(value));
  useEffect(() => setDraft(formatNumber(value, 3)), [value]);

  const commit = (raw: string) => {
    const n = Number(raw.replace(/\./g, '').replace(',', '.'));
    const v = Math.min(normalizeQty(n, min, step), Math.max(max, min));
    onChange(v);
    setDraft(formatNumber(v, 3));
  };

  const h = size === 'sm' ? 'h-9' : 'h-12';
  return (
    <div className={cn('inline-flex items-center rounded-lg border-2 border-cimento-200 bg-white', h)} role="group" aria-label={label}>
      <button
        type="button"
        className={cn('flex items-center justify-center text-petroleo-900 transition hover:bg-cimento-100 disabled:opacity-40', size === 'sm' ? 'w-8' : 'w-11', h)}
        onClick={() => onChange(Math.max(min, Number((value - step).toFixed(3))))}
        disabled={value <= min}
        aria-label="Diminuir quantidade"
      >
        <Minus className="h-4 w-4" />
      </button>
      <input
        inputMode="decimal"
        className={cn('w-14 border-x border-cimento-200 text-center text-sm font-bold text-petroleo-950 focus:outline-none', h)}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={(e) => commit(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && commit((e.target as HTMLInputElement).value)}
        aria-label={`${label} em ${unitLabels[unit].plural}`}
      />
      <button
        type="button"
        className={cn('flex items-center justify-center text-petroleo-900 transition hover:bg-cimento-100 disabled:opacity-40', size === 'sm' ? 'w-8' : 'w-11', h)}
        onClick={() => onChange(Math.min(Math.max(max, min), Number((value + step).toFixed(3))))}
        disabled={value + step > max}
        aria-label="Aumentar quantidade"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
