import { CartDrawer } from '@/components/cart/CartDrawer';
import { FlyToCartLayer } from '@/components/cart/FlyToCartLayer';
import { CookieConsent } from '@/components/layout/CookieConsent';
import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';
import { WhatsAppButton } from '@/components/layout/WhatsAppButton';
import { getCategories } from '@/lib/data';
import { jsonLd, storeJsonLd } from '@/lib/seo';

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const categories = await getCategories();
  return (
    <>
      <a
        href="#conteudo"
        className="sr-only z-[100] rounded bg-seguranca-500 px-4 py-2 font-bold text-petroleo-950 focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Pular para o conteúdo
      </a>
      <Header categories={categories} />
      <main id="conteudo" className="flex-1">
        {children}
      </main>
      <Footer categories={categories} />
      <CartDrawer />
      <FlyToCartLayer />
      <WhatsAppButton />
      <CookieConsent />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(storeJsonLd())} />
    </>
  );
}
