'use client';

import { CheckCircle2, Download, FileSpreadsheet, Loader2, Upload } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { importRowSchema } from '@/lib/validators';

// Cabeçalhos aceitos (planilha em português) → campos do sistema
const HEADER_MAP: Record<string, string> = {
  sku: 'sku', codigo: 'sku', código: 'sku',
  nome: 'name', produto: 'name', name: 'name',
  preco: 'price', preço: 'price', price: 'price',
  preco_promocional: 'promo_price', 'preço promocional': 'promo_price', promocao: 'promo_price', promo_price: 'promo_price',
  estoque: 'stock', stock: 'stock', quantidade: 'stock',
  unidade: 'unit', unit: 'unit',
  categoria: 'category', category: 'category',
  marca: 'brand', brand: 'brand',
  peso: 'weight_kg', peso_kg: 'weight_kg', weight_kg: 'weight_kg',
  descricao_curta: 'short_description', 'descrição curta': 'short_description', short_description: 'short_description',
};

const TEMPLATE = 'sku;nome;preco;preco_promocional;estoque;unidade;categoria;marca;peso_kg;descricao_curta\nCIM-CPII-50;Cimento CP II-F-32 Votorantim 50 kg;38,90;;420;saco;Cimento e Argamassa;Votorantim;50;Cimento Portland composto\n';

/** Converte "1.234,56" / "1234.56" / "R$ 38,90" em número */
function toNumber(v: unknown) {
  if (typeof v === 'number') return v;
  const s = String(v ?? '').replace(/[R$\s]/g, '');
  if (!s) return undefined;
  return Number(s.includes(',') ? s.replace(/\./g, '').replace(',', '.') : s);
}

function normalizeRow(raw: Record<string, unknown>) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(raw)) {
    const key = HEADER_MAP[k.trim().toLowerCase()];
    if (!key || v === '' || v == null) continue;
    out[key] = ['price', 'promo_price', 'stock', 'weight_kg'].includes(key) ? toNumber(v) : typeof v === 'string' ? v.trim() : v;
  }
  if (typeof out.unit === 'string') out.unit = out.unit.toLowerCase().replace('²', '2').replace('³', '3').replace('unidade', 'un');
  return out;
}

export function ProductImporter() {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [fileName, setFileName] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ created: number; updated: number; errors: { row: number; sku?: string; error: string }[] } | null>(null);

  const parse = async (file: File) => {
    setResult(null);
    setFileName(file.name);
    let data: Record<string, unknown>[];
    if (/\.(xlsx|xls)$/i.test(file.name)) {
      const XLSX = await import('xlsx');
      const wb = XLSX.read(await file.arrayBuffer());
      data = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { defval: '' });
    } else {
      const Papa = (await import('papaparse')).default;
      const text = await file.text();
      data = Papa.parse<Record<string, unknown>>(text, { header: true, skipEmptyLines: true, delimiter: text.split('\n')[0].includes(';') ? ';' : ',' }).data;
    }
    setRows(data.map(normalizeRow));
  };

  const validation = rows.map((r) => importRowSchema.safeParse(r));
  const invalid = validation.filter((v) => !v.success).length;

  const send = async () => {
    setLoading(true);
    const res = await fetch('/api/admin/produtos/importar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ rows }) });
    setResult(await res.json());
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="card flex flex-wrap items-center gap-4 p-5">
        <label className="btn-primary cursor-pointer">
          <Upload className="h-4 w-4" aria-hidden /> Escolher arquivo CSV ou Excel
          <input type="file" accept=".csv,.xlsx,.xls,text/csv" className="sr-only" onChange={(e) => e.target.files?.[0] && parse(e.target.files[0])} />
        </label>
        <a href={`data:text/csv;charset=utf-8,${encodeURIComponent('﻿' + TEMPLATE)}`} download="modelo-importacao-produtos.csv" className="btn-ghost">
          <Download className="h-4 w-4" aria-hidden /> Baixar modelo
        </a>
        {fileName && <p className="flex items-center gap-2 text-sm text-cimento-700"><FileSpreadsheet className="h-4 w-4" aria-hidden /> {fileName}: {rows.length} linhas{invalid ? `, ${invalid} com problema` : ''}</p>}
      </div>

      <p className="text-sm text-cimento-700">
        Colunas aceitas: <code>sku</code> (obrigatória), <code>nome</code>, <code>preco</code>, <code>preco_promocional</code>, <code>estoque</code>, <code>unidade</code>, <code>categoria</code>, <code>marca</code>, <code>peso_kg</code>, <code>descricao_curta</code>.
        SKUs existentes são atualizados só nas colunas preenchidas — ideal para atualizar a tabela de preços e o estoque de uma vez.
      </p>

      {rows.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] text-xs">
            <thead className="bg-cimento-50 text-left uppercase tracking-wider text-cimento-700">
              <tr><th className="p-2">#</th><th className="p-2">SKU</th><th className="p-2">Nome</th><th className="p-2">Preço</th><th className="p-2">Promo</th><th className="p-2">Estoque</th><th className="p-2">Unid.</th><th className="p-2">Categoria</th><th className="p-2">Validação</th></tr>
            </thead>
            <tbody className="divide-y divide-cimento-100">
              {rows.slice(0, 200).map((r, i) => {
                const v = validation[i];
                return (
                  <tr key={i} className={cn(!v.success && 'bg-red-50')}>
                    <td className="p-2 text-cimento-600">{i + 2}</td>
                    <td className="p-2 font-mono">{String(r.sku ?? '')}</td>
                    <td className="p-2">{String(r.name ?? '')}</td>
                    <td className="p-2">{String(r.price ?? '')}</td>
                    <td className="p-2">{String(r.promo_price ?? '')}</td>
                    <td className="p-2">{String(r.stock ?? '')}</td>
                    <td className="p-2">{String(r.unit ?? '')}</td>
                    <td className="p-2">{String(r.category ?? '')}</td>
                    <td className="p-2">{v.success ? '✓' : Object.keys(v.error.flatten().fieldErrors).join(', ')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {rows.length > 200 && <p className="p-3 text-xs text-cimento-600">Mostrando 200 de {rows.length} linhas.</p>}
        </div>
      )}

      {rows.length > 0 && (
        <button type="button" className="btn-primary" disabled={loading || invalid === rows.length} onClick={send}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />} Importar {rows.length - invalid} linhas válidas
        </button>
      )}

      {result && (
        <div className="card p-5" role="status">
          <p className="flex items-center gap-2 font-bold text-emerald-800"><CheckCircle2 className="h-5 w-5" aria-hidden /> {result.created} criados · {result.updated} atualizados</p>
          {result.errors.length > 0 && (
            <ul className="mt-3 max-h-60 space-y-1 overflow-y-auto text-sm text-red-800">
              {result.errors.map((e) => <li key={`${e.row}-${e.sku}`}>Linha {e.row} {e.sku && `(${e.sku})`}: {e.error}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
