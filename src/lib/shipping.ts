import { site } from '@/config/site';
import type { DeliveryZone, ShippingOption } from '@/types';
import { round2 } from './utils';

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

export function findZone(zones: DeliveryZone[], city: string, state: string) {
  return zones.find((z) => z.active && z.state === state && z.cities.some((c) => norm(c) === norm(city))) ?? null;
}

export interface ShippingInput {
  zones: DeliveryZone[];
  city: string | null;
  state: string | null;
  subtotal: number;
  /** peso total em kg (Σ peso × quantidade) */
  weightKg: number;
  freeShippingCoupon?: boolean;
}

/**
 * Frete por zona (cidade) e peso: base + R$/kg, grátis acima do valor mínimo da zona.
 * "Retirar na loja" é sempre oferecido e gratuito.
 */
export function quoteShipping(input: ShippingInput): { options: ShippingOption[]; outOfArea: boolean } {
  const options: ShippingOption[] = [];
  const zone = input.city && input.state ? findZone(input.zones, input.city, input.state) : null;

  if (zone && (zone.max_weight_kg == null || input.weightKg <= zone.max_weight_kg)) {
    const free = input.freeShippingCoupon || (zone.free_above != null && input.subtotal >= zone.free_above);
    const price = free ? 0 : round2(zone.base_price + zone.price_per_kg * input.weightKg);
    options.push({
      method: 'entrega',
      label: `Entrega — ${zone.name}`,
      description:
        `Em até ${zone.delivery_days} ${zone.delivery_days > 1 ? 'dias úteis' : 'dia útil'}` +
        (free ? ' · Frete grátis' : zone.free_above ? ` · grátis acima de R$ ${zone.free_above.toLocaleString('pt-BR')}` : ''),
      price,
      days: zone.delivery_days,
      zoneId: zone.id,
    });
  }

  options.push({
    method: 'retirada',
    label: 'Retirar na loja',
    description: `${site.address.street} – ${site.address.district}, ${site.address.city}. Pronto em até ${site.pickupReadyHours}h após a confirmação do pagamento.`,
    price: 0,
    days: 0,
    zoneId: null,
  });

  return { options, outOfArea: !zone };
}

export interface ViaCepResult {
  cep: string;
  street: string;
  district: string;
  city: string;
  state: string;
  complement: string;
}

export async function lookupCep(cep: string): Promise<ViaCepResult | null> {
  const digits = cep.replace(/\D/g, '');
  if (digits.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`, { next: { revalidate: 86_400 } });
    if (!res.ok) return null;
    const d = await res.json();
    if (d.erro) return null;
    return { cep: digits, street: d.logradouro ?? '', district: d.bairro ?? '', city: d.localidade ?? '', state: d.uf ?? '', complement: d.complemento ?? '' };
  } catch {
    return null;
  }
}
