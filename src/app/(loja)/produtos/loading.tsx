import { ProductGridSkeleton } from '@/components/product/ProductSkeleton';

export default function Loading() {
  return (
    <div className="container py-8 sm:py-10">
      <div className="skeleton mb-4 h-4 w-48" />
      <div className="skeleton mb-8 h-10 w-72" />
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <div className="hidden space-y-3 lg:block">
          {Array.from({ length: 9 }, (_, i) => (
            <div key={i} className="skeleton h-9" />
          ))}
        </div>
        <div>
          <div className="mb-5 flex justify-between">
            <div className="skeleton h-5 w-24" />
            <div className="skeleton h-9 w-48" />
          </div>
          <ProductGridSkeleton count={8} />
        </div>
      </div>
    </div>
  );
}
