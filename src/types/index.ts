export type SaleUnit = 'un' | 'm' | 'm2' | 'm3' | 'saco' | 'caixa' | 'barra' | 'lata' | 'rolo' | 'kg' | 'milheiro';

export type OrderStatus =
  | 'aguardando_pagamento'
  | 'pago'
  | 'em_separacao'
  | 'saiu_para_entrega'
  | 'entregue'
  | 'cancelado';

export type DeliveryMethod = 'entrega' | 'retirada';
export type PaymentMethod = 'pix' | 'cartao' | 'boleto';
export type PersonType = 'PF' | 'PJ';
export type QuoteStatus = 'novo' | 'em_analise' | 'respondido' | 'convertido' | 'recusado' | 'expirado';
export type CouponType = 'percentual' | 'valor_fixo' | 'frete_gratis';

export interface Category {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  icon: string | null;
  sort_order: number;
}

export interface Brand {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
}

export interface ProductImage {
  url: string;
  alt: string | null;
  sort_order: number;
}

export interface Product {
  id: string;
  sku: string;
  slug: string;
  name: string;
  short_description: string | null;
  description: string | null;
  category_id: string | null;
  brand_id: string | null;
  price: number;
  promo_price: number | null;
  promo_ends_at: string | null;
  unit: SaleUnit;
  unit_label: string | null;
  min_qty: number;
  qty_step: number;
  stock: number;
  min_stock: number;
  weight_kg: number;
  length_cm: number | null;
  width_cm: number | null;
  height_cm: number | null;
  specs: Record<string, string>;
  is_featured: boolean;
  is_active: boolean;
  sold_count: number;
  created_at?: string;
  images: ProductImage[];
  category?: Pick<Category, 'id' | 'slug' | 'name'> | null;
  brand?: Pick<Brand, 'id' | 'slug' | 'name'> | null;
}

export interface CartItem {
  productId: string;
  slug: string;
  sku: string;
  name: string;
  image: string | null;
  unit: SaleUnit;
  unitLabel: string | null;
  price: number; // preço efetivo no momento em que foi adicionado (o servidor recalcula no checkout)
  quantity: number;
  minQty: number;
  qtyStep: number;
  stock: number;
  weightKg: number;
}

export interface DeliveryZone {
  id: string;
  name: string;
  cities: string[];
  state: string;
  base_price: number;
  price_per_kg: number;
  free_above: number | null;
  max_weight_kg: number | null;
  delivery_days: number;
  active: boolean;
}

export interface ShippingOption {
  method: DeliveryMethod;
  label: string;
  description: string;
  price: number;
  days: number;
  zoneId: string | null;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  cta_label: string | null;
  placement: string;
  ends_at: string | null;
}

export interface Address {
  id?: string;
  label?: string;
  recipient?: string | null;
  cep: string;
  street: string;
  number: string;
  complement?: string | null;
  district: string;
  city: string;
  state: string;
  reference?: string | null;
  is_default?: boolean;
}

export interface Order {
  id: string;
  number: number;
  public_token: string;
  status: OrderStatus;
  delivery_method: DeliveryMethod;
  shipping_address: Address | null;
  customer_snapshot: {
    name: string;
    email: string;
    phone: string;
    person_type: PersonType;
    document: string;
    company_name?: string | null;
  };
  payment_method: PaymentMethod | null;
  subtotal: number;
  discount: number;
  shipping_cost: number;
  total: number;
  coupon_code: string | null;
  estimated_days: number | null;
  notes: string | null;
  created_at: string;
  paid_at: string | null;
  delivered_at: string | null;
  order_items?: OrderItem[];
  order_status_history?: { status: OrderStatus; note: string | null; created_at: string }[];
  payments?: Payment[];
}

export interface OrderItem {
  id: string;
  product_id: string | null;
  sku: string;
  name: string;
  unit: SaleUnit;
  unit_price: number;
  quantity: number;
  total: number;
}

export interface Payment {
  id: string;
  provider_payment_id: string | null;
  method: PaymentMethod;
  status: string;
  status_detail: string | null;
  amount: number;
  installments: number;
  pix_qr_code: string | null;
  pix_qr_code_base64: string | null;
  boleto_url: string | null;
  boleto_barcode: string | null;
  expires_at: string | null;
  created_at: string;
}
