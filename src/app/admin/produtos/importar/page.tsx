import Link from 'next/link';
import { ProductImporter } from '@/components/admin/ProductImporter';

export const metadata = { title: 'Importar produtos' };

export default function ImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/produtos" className="text-sm text-cimento-700 hover:underline">← Produtos</Link>
        <h1 className="text-2xl sm:text-3xl">Importar produtos e preços</h1>
      </div>
      <ProductImporter />
    </div>
  );
}
