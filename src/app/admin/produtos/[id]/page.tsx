import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProductForm } from '@/components/admin/ProductForm';
import { getSupabaseServer } from '@/lib/supabase/server';

export default async function AdminProductPage({ params }: { params: { id: string } }) {
  const sb = getSupabaseServer();
  const isNew = params.id === 'novo';
  const [{ data: categories }, { data: brands }, productRes] = await Promise.all([
    sb.from('categories').select('id, name').order('sort_order'),
    sb.from('brands').select('id, name').order('name'),
    isNew ? Promise.resolve({ data: null }) : sb.from('products').select('*, images:product_images(url, alt, sort_order)').eq('id', params.id).maybeSingle(),
  ]);
  const product = productRes.data;
  if (!isNew && !product) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/produtos" className="text-sm text-cimento-700 hover:underline">← Produtos</Link>
        <h1 className="text-2xl sm:text-3xl">{isNew ? 'Novo produto' : product!.name}</h1>
      </div>
      <ProductForm product={product} categories={categories ?? []} brands={brands ?? []} />
    </div>
  );
}
