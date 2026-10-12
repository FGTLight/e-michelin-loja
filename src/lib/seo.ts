import { site } from '@/config/site';
import type { Product } from '@/types';
import { effectivePrice, isPromoActive } from './utils';

const abs = (path: string) => (path.startsWith('http') ? path : `${site.url}${path}`);

export function storeJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': ['HardwareStore', 'LocalBusiness'],
    '@id': `${site.url}/#store`,
    name: site.name,
    legalName: site.legalName,
    url: site.url,
    logo: abs('/icon.svg'),
    image: abs('/opengraph-image'),
    telephone: site.phoneE164,
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: site.address.street,
      addressLocality: site.address.city,
      addressRegion: site.address.state,
      postalCode: site.address.cep,
      addressCountry: 'BR',
    },
    geo: { '@type': 'GeoCoordinates', latitude: site.geo.lat, longitude: site.geo.lng },
    openingHoursSpecification: site.hours
      .filter((h) => h.schema)
      .map((h) => ({ '@type': 'OpeningHoursSpecification', dayOfWeek: h.schema!.days, opens: h.schema!.opens, closes: h.schema!.closes })),
    areaServed: site.deliveryRegion.map((c) => ({ '@type': 'City', name: `${c} - RS` })),
    sameAs: [site.social.instagram, site.social.facebook],
    paymentAccepted: 'Pix, Cartão de crédito, Boleto',
    currenciesAccepted: 'BRL',
  };
}

export function productJsonLd(p: Product) {
  const price = effectivePrice(p);
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: p.name,
    sku: p.sku,
    description: p.short_description ?? p.description ?? undefined,
    image: p.images.map((i) => abs(i.url)),
    brand: p.brand ? { '@type': 'Brand', name: p.brand.name } : undefined,
    category: p.category?.name,
    weight: p.weight_kg ? { '@type': 'QuantitativeValue', value: p.weight_kg, unitCode: 'KGM' } : undefined,
    offers: {
      '@type': 'Offer',
      url: abs(`/produto/${p.slug}`),
      priceCurrency: 'BRL',
      price: price.toFixed(2),
      ...(isPromoActive(p) && p.promo_ends_at ? { priceValidUntil: p.promo_ends_at.slice(0, 10) } : {}),
      availability: p.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@id': `${site.url}/#store` },
      hasMerchantReturnPolicy: {
        '@type': 'MerchantReturnPolicy',
        applicableCountry: 'BR',
        returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
        merchantReturnDays: 7,
        returnMethod: 'https://schema.org/ReturnInStore',
      },
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({ '@type': 'ListItem', position: i + 1, name: it.name, item: abs(it.path) })),
  };
}

/** Serializa JSON-LD com segurança (evita fechar a tag <script>) */
export const jsonLd = (data: unknown) => ({ __html: JSON.stringify(data).replace(/</g, '\u003c') });
