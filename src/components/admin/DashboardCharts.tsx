'use client';

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatBRL } from '@/lib/utils';

// Série única → um só matiz (petróleo), sem legenda: o título do card nomeia a série.
const INK = '#1f667f';
const GRID = '#e5e2dc';
const AXIS = { fontSize: 12, fill: '#5c5851' };

function TooltipBox({ active, payload, label, money = true }: { active?: boolean; payload?: { value: number }[]; label?: string; money?: boolean }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg bg-white px-3 py-2 text-xs shadow-lift ring-1 ring-cimento-200">
      <p className="text-cimento-600">{label}</p>
      <p className="font-bold text-petroleo-950">{money ? formatBRL(payload[0].value) : payload[0].value}</p>
    </div>
  );
}

export function SalesChart({ data }: { data: { day: string; total: number }[] }) {
  return (
    <figure>
      <div className="h-64" role="img" aria-label="Faturamento diário dos últimos 30 dias">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="sales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={INK} stopOpacity={0.25} />
                <stop offset="100%" stopColor={INK} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={GRID} vertical={false} />
            <XAxis dataKey="day" tick={AXIS} tickLine={false} axisLine={false} interval="preserveStartEnd" minTickGap={24} />
            <YAxis tick={AXIS} tickLine={false} axisLine={false} width={64} tickFormatter={(v: number) => (v >= 1000 ? `R$ ${Math.round(v / 1000)}k` : `R$ ${v}`)} />
            <Tooltip content={<TooltipBox />} cursor={{ stroke: '#a29d92', strokeDasharray: '4 4' }} />
            <Area type="monotone" dataKey="total" stroke={INK} strokeWidth={2} fill="url(#sales)" activeDot={{ r: 5, stroke: '#fff', strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">
        <table>
          <thead><tr><th>Dia</th><th>Faturamento</th></tr></thead>
          <tbody>{data.map((d) => <tr key={d.day}><td>{d.day}</td><td>{formatBRL(d.total)}</td></tr>)}</tbody>
        </table>
      </figcaption>
    </figure>
  );
}

export function TopProductsChart({ data }: { data: { name: string; total: number }[] }) {
  return (
    <div className="h-72" role="img" aria-label="Produtos com maior faturamento no mês">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 16, left: 0, bottom: 0 }} barCategoryGap={6}>
          <CartesianGrid stroke={GRID} horizontal={false} />
          <XAxis type="number" tick={AXIS} tickLine={false} axisLine={false} tickFormatter={(v: number) => `R$ ${Math.round(v / 1000)}k`} />
          <YAxis type="category" dataKey="name" tick={{ ...AXIS, fontSize: 11 }} tickLine={false} axisLine={false} width={150} tickFormatter={(v: string) => (v.length > 22 ? `${v.slice(0, 21)}…` : v)} />
          <Tooltip content={<TooltipBox />} cursor={{ fill: 'rgba(31,102,127,.06)' }} />
          <Bar dataKey="total" fill={INK} radius={[0, 4, 4, 0]} maxBarSize={18} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
