import type { Metadata } from 'next';
import { WishlistView } from '@/components/account/WishlistView';

export const metadata: Metadata = { title: 'Lista de desejos', robots: { index: false } };

export default function WishlistPage() {
  return (
    <div className="container py-8 sm:py-12">
      <h1 className="mb-8 text-3xl">Lista de desejos</h1>
      <WishlistView />
    </div>
  );
}
