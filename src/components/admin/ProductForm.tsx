'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowDown, ArrowUp, ImagePlus, Loader2, Plus, Trash2, X } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
import { Field } from '@/components/ui/Field';
import { getSupabaseBrowser } from '@/lib/supabase/client';
import { slugify, unitLabels } from '@/lib/utils';
import { productAdminSchema } from '@/lib/validators';

type FormIn = z.input<typeof productAdminSchema>;
type DbProduct = Record<string, unknown> & { id: string; specs: Record<string, string>; images: { url: string; alt: string | null; sort_order: number }[] };

const toLocal = (iso: unknown) => (typeof iso === 'string' ? new Date(new Date(iso).getTime() - 3 * 3_600_000).toISOString().slice(0, 16) : '');
const fromLocal = (v: string) => (v ? `${v}:00-03:00` : null);

export function ProductForm({ product, categories, brands }: { product: DbProduct | null; categories: { id: string; name: string }[]; brands: { id: string; name: string }[] }) {
  const router = useRouter();
  const [specs, setSpecs] = useState<{ k: string; v: string }[]>(Object.entries(product?.specs ?? {}).map(([k, v]) => ({ k, v })));
  const [images, setImages] = useState<{ url: string; alt: string | null }[]>(
    [...(product?.images ?? [])].sort((a, b) => a.sort_order - b.sort_order).map(({ url, alt }) => ({ url, alt })),
  );
  const [promoEnds, setPromoEnds] = useState(toLocal(product?.promo_ends_at));
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<FormIn>({
    resolver: zodResolver(productAdminSchema),
    defaultValues: {
      sku: (product?.sku as string) ?? '',
      name: (product?.name as string) ?? '',
      slug: (product?.slug as string) ?? '',
      short_description: (product?.short_description as string) ?? '',
      description: (product?.description as string) ?? '',
      category_id: (product?.category_id as string) ?? null,
      brand_id: (product?.brand_id as string) ?? null,
      price: (product?.price as number) ?? 0,
      promo_price: (product?.promo_price as number) ?? null,
      unit: (product?.unit as FormIn['unit']) ?? 'un',
      unit_label: (product?.unit_label as string) ?? '',
      min_qty: (product?.min_qty as number) ?? 1,
      qty_step: (product?.qty_step as number) ?? 1,
      stock: (product?.stock as number) ?? 0,
      min_stock: (product?.min_stock as number) ?? 5,
      weight_kg: (product?.weight_kg as number) ?? 0,
      length_cm: (product?.length_cm as number) ?? null,
      width_cm: (product?.width_cm as number) ?? null,
      height_cm: (product?.height_cm as number) ?? null,
      is_featured: (product?.is_featured as boolean) ?? false,
      is_active: (product?.is_active as boolean) ?? true,
    },
  });

  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setUploading(true);
    const sb = getSupabaseBrowser();
    const sku = slugify(watch('sku') || 'produto');
    for (const file of Array.from(files).slice(0, 10 - images.length)) {
      if (!file.type.startsWith('image/') || file.size > 5 * 1024 * 1024) {
        setMsg({ ok: false, text: `${file.name}: envie imagens de até 5 MB.` });
        continue;
      }
      const path = `${sku}/${Date.now()}-${slugify(file.name.replace(/\.[^.]+$/, ''))}.${file.name.split('.').pop()}`;
      const { error } = await sb.storage.from('products').upload(path, file, { cacheControl: '31536000', upsert: false });
      if (error) {
        setMsg({ ok: false, text: `Falha no upload de ${file.name}.` });
        continue;
      }
      const { data } = sb.storage.from('products').getPublicUrl(path);
      setImages((prev) => [...prev, { url: data.publicUrl, alt: watch('name') || null }]);
    }
    setUploading(false);
  };

  const move = (i: number, d: -1 | 1) => setImages((prev) => {
    const next = [...prev];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    return next;
  });

  const onSubmit = handleSubmit(async (values) => {
    setSaving(true);
    setMsg(null);
    const body = {
      ...values,
      slug: values.slug || slugify(values.name),
      promo_ends_at: fromLocal(promoEnds),
      specs: Object.fromEntries(specs.filter((s) => s.k.trim() && s.v.trim()).map((s) => [s.k.trim(), s.v.trim()])),
      images,
    };
    const res = await fetch(product ? `/api/admin/produtos/${product.id}` : '/api/admin/produtos', {
      method: product ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) return setMsg({ ok: false, text: data.error ?? 'Erro ao salvar' });
    setMsg({ ok: true, text: 'Produto salvo.' });
    if (!product) router.replace(`/admin/produtos/${data.id}`);
    router.refresh();
  });

  const remove = async () => {
    if (!product || !confirm('Excluir este produto? Pedidos antigos mantêm o nome e o SKU.')) return;
    const res = await fetch(`/api/admin/produtos/${product.id}`, { method: 'DELETE' });
    if (res.ok) {
      router.replace('/admin/produtos');
      router.refresh();
    }
  };

  const num = (name: keyof FormIn) => register(name, { setValueAs: (v: string) => (v === '' ? null : Number(v)) });

  return (
    <form onSubmit={onSubmit} className="grid gap-6 xl:grid-cols-[1fr_380px]" noValidate>
      <div className="space-y-6">
        <section className="card grid gap-4 p-5 sm:grid-cols-2">
          <Field label="Nome" required className="sm:col-span-2" {...register('name', { onBlur: (e) => !watch('slug') && setValue('slug', slugify(e.target.value)) })} error={errors.name?.message} />
          <Field label="SKU" required {...register('sku')} error={errors.sku?.message} />
          <Field label="Slug (URL)" hint="Gerado a partir do nome" {...register('slug')} />
          <Field label="Descrição curta" className="sm:col-span-2" {...register('short_description')} />
          <label className="sm:col-span-2"><span className="label">Descrição completa</span><textarea className="input min-h-32" {...register('description')} /></label>
          <label><span className="label">Categoria</span>
            <select className="input" {...register('category_id', { setValueAs: (v) => v || null })}><option value="">—</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
          </label>
          <label><span className="label">Marca</span>
            <select className="input" {...register('brand_id', { setValueAs: (v) => v || null })}><option value="">Sem marca</option>{brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>
          </label>
        </section>

        <section className="card grid gap-4 p-5 sm:grid-cols-3">
          <h2 className="text-lg sm:col-span-3">Preço e venda</h2>
          <Field label="Preço (R$)" type="number" step="0.01" min={0} required {...num('price')} error={errors.price?.message} />
          <Field label="Preço promocional (R$)" type="number" step="0.01" min={0} {...num('promo_price')} error={errors.promo_price?.message} />
          <Field label="Promoção termina em" type="datetime-local" value={promoEnds} onChange={(e) => setPromoEnds(e.target.value)} hint="Vazio = sem prazo" />
          <label><span className="label">Unidade de venda</span>
            <select className="input" {...register('unit')}>{Object.entries(unitLabels).map(([k, v]) => <option key={k} value={k}>{v.long}</option>)}</select>
          </label>
          <Field label="Rótulo da unidade" placeholder="saco 50 kg, barra 6 m…" {...register('unit_label')} />
          <div className="grid grid-cols-2 gap-2">
            <Field label="Qtd. mínima" type="number" step="any" {...num('min_qty')} />
            <Field label="Múltiplo" type="number" step="any" {...num('qty_step')} />
          </div>
        </section>

        <section className="card grid gap-4 p-5 sm:grid-cols-3">
          <h2 className="text-lg sm:col-span-3">Estoque e logística</h2>
          <Field label="Estoque" type="number" step="any" min={0} {...num('stock')} error={errors.stock?.message} />
          <Field label="Estoque mínimo (alerta)" type="number" step="any" min={0} {...num('min_stock')} />
          <Field label="Peso (kg)" type="number" step="0.001" min={0} {...num('weight_kg')} hint="Usado no cálculo do frete" />
          <Field label="Comprimento (cm)" type="number" step="0.1" {...num('length_cm')} />
          <Field label="Largura (cm)" type="number" step="0.1" {...num('width_cm')} />
          <Field label="Altura (cm)" type="number" step="0.1" {...num('height_cm')} />
        </section>

        <section className="card p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg">Especificações técnicas</h2>
            <button type="button" className="btn-ghost px-3 py-1.5" onClick={() => setSpecs([...specs, { k: '', v: '' }])}><Plus className="h-4 w-4" aria-hidden /> Adicionar</button>
          </div>
          <ul className="space-y-2">
            {specs.map((s, i) => (
              <li key={i} className="flex gap-2">
                <input aria-label="Nome da especificação" className="input" placeholder="Ex.: Bitola" value={s.k} onChange={(e) => setSpecs(specs.map((x, j) => (j === i ? { ...x, k: e.target.value } : x)))} />
                <input aria-label="Valor da especificação" className="input" placeholder="Ex.: 25 mm" value={s.v} onChange={(e) => setSpecs(specs.map((x, j) => (j === i ? { ...x, v: e.target.value } : x)))} />
                <button type="button" className="btn-ghost px-3" aria-label="Remover especificação" onClick={() => setSpecs(specs.filter((_, j) => j !== i))}><X className="h-4 w-4" /></button>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <div className="space-y-6">
        <section className="card p-5">
          <h2 className="mb-3 text-lg">Imagens</h2>
          <ul className="grid grid-cols-3 gap-2">
            {images.map((img, i) => (
              <li key={img.url} className="group relative aspect-square overflow-hidden rounded-lg bg-cimento-100">
                <Image src={img.url} alt={img.alt ?? ''} fill sizes="120px" className="object-cover" />
                {i === 0 && <span className="absolute left-1 top-1 rounded bg-seguranca-500 px-1.5 text-[10px] font-bold text-petroleo-950">Capa</span>}
                <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-petroleo-950/70 p-1 opacity-0 transition group-focus-within:opacity-100 group-hover:opacity-100">
                  {i > 0 && <button type="button" aria-label="Mover para a esquerda" className="rounded p-1 text-white hover:bg-white/20" onClick={() => move(i, -1)}><ArrowUp className="h-3.5 w-3.5 -rotate-90" /></button>}
                  {i < images.length - 1 && <button type="button" aria-label="Mover para a direita" className="rounded p-1 text-white hover:bg-white/20" onClick={() => move(i, 1)}><ArrowDown className="h-3.5 w-3.5 -rotate-90" /></button>}
                  <button type="button" aria-label="Remover imagem" className="rounded p-1 text-white hover:bg-red-600" onClick={() => setImages(images.filter((_, j) => j !== i))}><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </li>
            ))}
            <li>
              <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-cimento-300 text-xs text-cimento-600 hover:border-petroleo-500">
                {uploading ? <Loader2 className="h-6 w-6 animate-spin" /> : <ImagePlus className="h-6 w-6" aria-hidden />}
                Enviar
                <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple className="sr-only" onChange={(e) => upload(e.target.files)} />
              </label>
            </li>
          </ul>
          <p className="mt-2 text-xs text-cimento-600">JPG, PNG ou WebP até 5 MB. O site entrega automaticamente em WebP/AVIF otimizado.</p>
        </section>

        <section className="card space-y-3 p-5">
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="h-4 w-4 accent-petroleo-800" {...register('is_active')} /> Ativo (visível na loja)</label>
          <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" className="h-4 w-4 accent-petroleo-800" {...register('is_featured')} /> Destaque</label>
          {msg && <p role={msg.ok ? 'status' : 'alert'} className={msg.ok ? 'text-sm text-emerald-800' : 'text-sm text-red-800'}>{msg.text}</p>}
          <button type="submit" className="btn-primary w-full" disabled={saving}>{saving && <Loader2 className="h-4 w-4 animate-spin" />} Salvar produto</button>
          {product && <button type="button" className="btn-ghost w-full text-red-700" onClick={remove}><Trash2 className="h-4 w-4" aria-hidden /> Excluir</button>}
        </section>
      </div>
    </form>
  );
}
