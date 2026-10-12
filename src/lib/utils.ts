import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { OrderStatus, Product, SaleUnit } from '@/types';

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
export const formatBRL = (v: number) => brl.format(v);

export const formatNumber = (v: number, digits = 0) =>
  new Intl.NumberFormat('pt-BR', { maximumFractionDigits: digits }).format(v);

export const formatDate = (iso: string, withTime = false) =>
  new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    ...(withTime ? { timeStyle: 'short' } : {}),
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(iso));

export const round2 = (v: number) => Math.round((v + Number.EPSILON) * 100) / 100;

export const unitLabels: Record<SaleUnit, { short: string; long: string; plural: string }> = {
  un: { short: 'un', long: 'unidade', plural: 'unidades' },
  m: { short: 'm', long: 'metro', plural: 'metros' },
  m2: { short: 'm²', long: 'metro quadrado', plural: 'm²' },
  m3: { short: 'm³', long: 'metro cúbico', plural: 'm³' },
  saco: { short: 'sc', long: 'saco', plural: 'sacos' },
  caixa: { short: 'cx', long: 'caixa', plural: 'caixas' },
  barra: { short: 'br', long: 'barra', plural: 'barras' },
  lata: { short: 'lt', long: 'lata', plural: 'latas' },
  rolo: { short: 'rl', long: 'rolo', plural: 'rolos' },
  kg: { short: 'kg', long: 'quilo', plural: 'kg' },
  milheiro: { short: 'mil', long: 'milheiro', plural: 'milheiros' },
};

export const formatQty = (qty: number, unit: SaleUnit) => {
  const u = unitLabels[unit];
  return `${formatNumber(qty, 3)} ${qty === 1 ? u.long : u.plural}`;
};

export function isPromoActive(p: Pick<Product, 'promo_price' | 'promo_ends_at'>, now = Date.now()) {
  if (p.promo_price == null) return false;
  return !p.promo_ends_at || new Date(p.promo_ends_at).getTime() > now;
}

export const effectivePrice = (p: Pick<Product, 'price' | 'promo_price' | 'promo_ends_at'>) =>
  isPromoActive(p) ? (p.promo_price as number) : p.price;

export const discountPercent = (p: Pick<Product, 'price' | 'promo_price' | 'promo_ends_at'>) =>
  isPromoActive(p) ? Math.round((1 - (p.promo_price as number) / p.price) * 100) : 0;

/** Ajusta a quantidade ao mínimo e ao múltiplo de venda do produto */
export function normalizeQty(qty: number, minQty: number, step: number) {
  if (!Number.isFinite(qty) || qty < minQty) return minQty;
  const steps = Math.round((qty - minQty) / step);
  return Number((minQty + steps * step).toFixed(3));
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export const onlyDigits = (s: string) => s.replace(/\D/g, '');

// ----------------------------------------------------------------------------- Documentos
export function isValidCPF(value: string) {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(cpf[9]) && calc(10) === Number(cpf[10]);
}

export function isValidCNPJ(value: string) {
  const cnpj = onlyDigits(value);
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;
  const calc = (len: number) => {
    const weights = len === 12 ? [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2] : [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const sum = weights.reduce((acc, w, i) => acc + Number(cnpj[i]) * w, 0);
    const r = sum % 11;
    return r < 2 ? 0 : 11 - r;
  };
  return calc(12) === Number(cnpj[12]) && calc(13) === Number(cnpj[13]);
}

export const maskCPF = (v: string) =>
  onlyDigits(v).slice(0, 11).replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');

export const maskCNPJ = (v: string) =>
  onlyDigits(v)
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');

export const maskCEP = (v: string) => onlyDigits(v).slice(0, 8).replace(/(\d{5})(\d)/, '$1-$2');

export const maskPhone = (v: string) => {
  const d = onlyDigits(v).slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{4})(\d)/, '$1-$2');
  return d.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2');
};

// ----------------------------------------------------------------------------- Pedidos
export const orderStatusLabels: Record<OrderStatus, string> = {
  aguardando_pagamento: 'Aguardando pagamento',
  pago: 'Pago',
  em_separacao: 'Em separação',
  saiu_para_entrega: 'Saiu para entrega',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

export const orderStatusFlow: OrderStatus[] = ['aguardando_pagamento', 'pago', 'em_separacao', 'saiu_para_entrega', 'entregue'];

/** Para retirada na loja, "saiu para entrega" significa "pronto para retirada" */
export const statusLabelFor = (status: OrderStatus, method: 'entrega' | 'retirada') =>
  method === 'retirada' && status === 'saiu_para_entrega'
    ? 'Pronto para retirada'
    : method === 'retirada' && status === 'entregue'
      ? 'Retirado'
      : orderStatusLabels[status];

export const orderStatusColors: Record<OrderStatus, string> = {
  aguardando_pagamento: 'bg-amber-100 text-amber-900',
  pago: 'bg-emerald-100 text-emerald-900',
  em_separacao: 'bg-sky-100 text-sky-900',
  saiu_para_entrega: 'bg-indigo-100 text-indigo-900',
  entregue: 'bg-petroleo-100 text-petroleo-900',
  cancelado: 'bg-red-100 text-red-900',
};

export const formatOrderNumber = (n: number) => `#${n.toString().padStart(6, '0')}`;

/** Parcelas sem juros respeitando o valor mínimo por parcela */
export function maxInstallments(total: number, max = 10, minValue = 50) {
  return Math.max(1, Math.min(max, Math.floor(total / minValue)));
}

/** Dias corridos restantes para o direito de arrependimento (art. 49 do CDC) */
export function withdrawalDaysLeft(deliveredAt: string | null) {
  if (!deliveredAt) return null;
  const diff = 7 - Math.floor((Date.now() - new Date(deliveredAt).getTime()) / 86_400_000);
  return Math.max(0, diff);
}
