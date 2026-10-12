import { BestSellers } from '@/components/home/BestSellers';
import { BrandsMarquee } from '@/components/home/BrandsMarquee';
import { Categories } from '@/components/home/Categories';
import { Hero } from '@/components/home/Hero';
import { Location } from '@/components/home/Location';
import { MaterialCalculator } from '@/components/home/MaterialCalculator';
import { WeeklyDeals } from '@/components/home/WeeklyDeals';
import { WhyUs } from '@/components/home/WhyUs';
import { CALC_SKUS } from '@/lib/calculator';
import { getActiveBanners, getBestSellers, getBrands, getCategories, getProductsBySkus, getWeeklyDeals } from '@/lib/data';

// ISR: a home é regenerada a cada 5 minutos (preços e ofertas atualizados sem perder performance)
export const revalidate = 300;

export default async function HomePage() {
  const [categories, deals, bestSellers, calcProducts, brands, banners] = await Promise.all([
    getCategories(),
    getWeeklyDeals(),
    getBestSellers(8),
    getProductsBySkus(Object.values(CALC_SKUS)),
    getBrands(),
    getActiveBanners('ofertas'),
  ]);

  return (
    <>
      <Hero />
      <Categories categories={categories} />
      <WeeklyDeals products={deals} banner={banners[0]} />
      <BestSellers products={bestSellers} />
      <MaterialCalculator products={calcProducts} />
      <WhyUs />
      <BrandsMarquee brands={brands} />
      <Location />
    </>
  );
}
