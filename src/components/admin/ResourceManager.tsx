'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Loader2, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { resources, type ResourceField, type ResourceKey } from '@/lib/admin-resources';
import { formatDate } from '@/lib/utils';

type Row = Record<string, unknown> & { id: string };

const toLocal = (iso: unknown) => (typeof iso === 'string' && iso ? new Date(new Date(iso).getTime() - 3 * 3_600_000).toISOString().slice(0, 16) : '');

function display(f: ResourceField, v: unknown) {
  if (v == null || v === '') return '—';
  if (f.type === 'boolean') return v ? 'Sim' : 'Não';
  if (f.type === 'datetime') return formatDate(String(v), true);
  if (f.type === 'list') return (v as string[]).join(', ');
  if (f.type === 'select') return f.options?.find((o) => o.value === v)?.label ?? String(v);
  return String(v);
}

export function ResourceManager({ resource, rows }: { resource: ResourceKey; rows: Row[] }) {
  const cfg = resources[resource];
  const fields = cfg.fields as ResourceField[];
  const router = useRouter();
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const open = (row?: Row) => {
    setErrors({});
    const base: Record<string, unknown> = {};
    fields.forEach((f) => {
      const v = row?.[f.name];
      base[f.name] = f.type === 'boolean' ? (v ?? true) : f.type === 'datetime' ? toLocal(v) : f.type === 'list' ? ((v as string[]) ?? []).join(', ') : (v ?? '');
    });
    setEditing({ ...base, id: row?.id });
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    const payload: Record<string, unknown> = {};
    fields.forEach((f) => {
      const v = editing[f.name];
      payload[f.name] = f.type === 'datetime' ? (v ? `${v}:00-03:00` : null) : v;
    });
    const parsed = cfg.schema.safeParse(payload);
    if (!parsed.success) {
      setErrors(Object.fromEntries(Object.entries(parsed.error.flatten().fieldErrors).map(([k, v]) => [k, (v as string[])[0]])));
      return;
    }
    setSaving(true);
    const id = editing.id as string | undefined;
    const res = await fetch(`/api/admin/recursos/${resource}${id ? `?id=${id}` : ''}`, {
      method: id ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setErrors({ _: data.error ?? 'Erro ao salvar' });
    setEditing(null);
    router.refresh();
  };

  const remove = async (id: string) => {
    if (!confirm('Excluir este registro?')) return;
    const res = await fetch(`/api/admin/recursos/${resource}?id=${id}`, { method: 'DELETE' });
    if (res.ok) router.refresh();
    else alert((await res.json()).error ?? 'Não foi possível excluir');
  };

  const tableFields = fields.filter((f) => f.showInTable);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl">{cfg.title}</h1>
        <button type="button" className="btn-primary px-4 py-2" onClick={() => open()}><Plus className="h-4 w-4" aria-hidden /> Novo</button>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-cimento-50 text-left text-xs uppercase tracking-wider text-cimento-700">
            <tr>{tableFields.map((f) => <th key={f.name} className="p-3">{f.label}</th>)}<th className="p-3"><span className="sr-only">Ações</span></th></tr>
          </thead>
          <tbody className="divide-y divide-cimento-100">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-cimento-50">
                {tableFields.map((f) => <td key={f.name} className="max-w-[260px] truncate p-3">{display(f, r[f.name])}</td>)}
                <td className="whitespace-nowrap p-3 text-right">
                  <button type="button" className="rounded p-2 hover:bg-cimento-100" aria-label="Editar" onClick={() => open(r)}><Pencil className="h-4 w-4" /></button>
                  <button type="button" className="rounded p-2 text-red-700 hover:bg-red-50" aria-label="Excluir" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4" /></button>
                </td>
              </tr>
            ))}
            {!rows.length && <tr><td colSpan={tableFields.length + 1} className="p-8 text-center text-cimento-600">Nenhum registro.</td></tr>}
          </tbody>
        </table>
      </div>

      <AnimatePresence>
        {editing && (
          <>
            <motion.div className="fixed inset-0 z-40 bg-petroleo-950/50" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditing(null)} />
            <motion.form
              onSubmit={save}
              role="dialog"
              aria-modal="true"
              aria-label={editing.id ? 'Editar' : 'Novo'}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 40 }}
              className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-white shadow-lift"
              noValidate
            >
              <div className="flex items-center justify-between border-b border-cimento-200 p-5">
                <h2 className="text-lg">{editing.id ? 'Editar' : 'Novo registro'}</h2>
                <button type="button" onClick={() => setEditing(null)} className="rounded p-2 hover:bg-cimento-100" aria-label="Fechar"><X className="h-5 w-5" /></button>
              </div>
              <div className="flex-1 space-y-4 overflow-y-auto p-5">
                {fields.filter((f) => f.name !== 'used_count').map((f) => {
                  const id = `rf-${f.name}`;
                  const v = editing[f.name];
                  const set = (val: unknown) => setEditing({ ...editing, [f.name]: val });
                  const err = errors[f.name];
                  if (f.type === 'boolean') {
                    return <label key={f.name} className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="h-4 w-4 accent-petroleo-800" checked={Boolean(v)} onChange={(e) => set(e.target.checked)} /> {f.label}</label>;
                  }
                  return (
                    <div key={f.name}>
                      <label htmlFor={id} className="label">{f.label}</label>
                      {f.type === 'textarea' || f.type === 'list' ? (
                        <textarea id={id} className="input min-h-20" value={String(v ?? '')} onChange={(e) => set(e.target.value)} aria-invalid={Boolean(err)} />
                      ) : f.type === 'select' ? (
                        <select id={id} className="input" value={String(v ?? '')} onChange={(e) => set(e.target.value)} aria-invalid={Boolean(err)}>
                          <option value="">—</option>
                          {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      ) : (
                        <input id={id} className="input" type={f.type === 'number' ? 'number' : f.type === 'datetime' ? 'datetime-local' : 'text'} step={f.type === 'number' ? 'any' : undefined} value={String(v ?? '')} onChange={(e) => set(e.target.value)} aria-invalid={Boolean(err)} />
                      )}
                      {f.hint && !err && <p className="mt-1 text-xs text-cimento-600">{f.hint}</p>}
                      {err && <p role="alert" className="field-error">{err}</p>}
                    </div>
                  );
                })}
                {errors._ && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-800">{errors._}</p>}
              </div>
              <div className="border-t border-cimento-200 p-5">
                <button className="btn-primary w-full" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar</button>
              </div>
            </motion.form>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
