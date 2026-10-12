import { z } from 'zod';
import { isValidCNPJ, isValidCPF, onlyDigits } from './utils';

const UF = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'] as const;

const phone = z
  .string()
  .transform(onlyDigits)
  .refine((v) => v.length === 10 || v.length === 11, 'Telefone inválido (com DDD)');

export const customerSchema = z
  .object({
    personType: z.enum(['PF', 'PJ']),
    name: z.string().trim().min(3, 'Informe o nome completo').max(120),
    email: z.string().trim().toLowerCase().email('E-mail inválido'),
    phone,
    cpf: z.string().optional().default(''),
    cnpj: z.string().optional().default(''),
    companyName: z.string().trim().max(160).optional().default(''),
    stateRegistration: z.string().trim().max(30).optional().default(''),
  })
  .superRefine((v, ctx) => {
    if (v.personType === 'PF' && !isValidCPF(v.cpf)) ctx.addIssue({ code: 'custom', path: ['cpf'], message: 'CPF inválido' });
    if (v.personType === 'PJ') {
      if (!isValidCNPJ(v.cnpj)) ctx.addIssue({ code: 'custom', path: ['cnpj'], message: 'CNPJ inválido' });
      if (v.companyName.length < 2) ctx.addIssue({ code: 'custom', path: ['companyName'], message: 'Informe a razão social' });
    }
  })
  .transform((v) => ({ ...v, cpf: onlyDigits(v.cpf), cnpj: onlyDigits(v.cnpj) }));
export type CustomerInput = z.input<typeof customerSchema>;

export const addressSchema = z.object({
  cep: z.string().transform(onlyDigits).refine((v) => v.length === 8, 'CEP inválido'),
  street: z.string().trim().min(2, 'Informe a rua').max(160),
  number: z.string().trim().min(1, 'Informe o número').max(20),
  complement: z.string().trim().max(80).optional().default(''),
  district: z.string().trim().min(2, 'Informe o bairro').max(80),
  city: z.string().trim().min(2, 'Informe a cidade').max(80),
  state: z.enum(UF, { errorMap: () => ({ message: 'UF inválida' }) }),
  reference: z.string().trim().max(160).optional().default(''),
});
export type AddressInput = z.input<typeof addressSchema>;

export const cartItemsSchema = z
  .array(z.object({ productId: z.string().uuid(), quantity: z.number().positive().max(100_000) }))
  .min(1, 'Carrinho vazio')
  .max(100);

export const checkoutSchema = z.object({
  customer: customerSchema,
  address: addressSchema,
  deliveryMethod: z.enum(['entrega', 'retirada']),
  couponCode: z.string().trim().toUpperCase().max(30).optional().default(''),
  notes: z.string().trim().max(500).optional().default(''),
  items: cartItemsSchema,
  lgpdConsent: z.literal(true, { errorMap: () => ({ message: 'É necessário aceitar a Política de Privacidade' }) }),
  marketingOptIn: z.boolean().optional().default(false),
});
export type CheckoutInput = z.input<typeof checkoutSchema>;

export const shippingQuoteSchema = z.object({
  cep: z.string().transform(onlyDigits).refine((v) => v.length === 8, 'CEP inválido'),
  items: cartItemsSchema,
  couponCode: z.string().trim().toUpperCase().max(30).optional(),
  city: z.string().trim().max(80).optional(),
  state: z.string().trim().length(2).optional(),
});

export const paymentSchema = z.discriminatedUnion('method', [
  z.object({ method: z.literal('pix'), orderToken: z.string().uuid() }),
  z.object({ method: z.literal('boleto'), orderToken: z.string().uuid() }),
  z.object({
    method: z.literal('cartao'),
    orderToken: z.string().uuid(),
    token: z.string().min(10),
    installments: z.number().int().min(1).max(12),
    paymentMethodId: z.string().min(2),
    issuerId: z.union([z.string(), z.number()]).optional(),
    payer: z.object({
      email: z.string().email(),
      identification: z.object({ type: z.string(), number: z.string() }).optional(),
    }),
  }),
]);
export type PaymentInput = z.infer<typeof paymentSchema>;

export const quoteRequestSchema = z.object({
  personType: z.enum(['PF', 'PJ']),
  name: z.string().trim().min(3, 'Informe o nome').max(120),
  email: z.string().trim().toLowerCase().email('E-mail inválido'),
  phone,
  document: z.string().trim().max(20).optional().default(''),
  companyName: z.string().trim().max(160).optional().default(''),
  city: z.string().trim().max(80).optional().default(''),
  projectDescription: z.string().trim().max(2000).optional().default(''),
  items: z
    .array(
      z.object({
        productId: z.string().uuid().optional(),
        description: z.string().trim().min(2).max(200),
        quantity: z.number().positive().max(1_000_000),
        unit: z.enum(['un', 'm', 'm2', 'm3', 'saco', 'caixa', 'barra', 'lata', 'rolo', 'kg', 'milheiro']),
      }),
    )
    .min(1, 'Adicione ao menos um item')
    .max(200),
  lgpdConsent: z.literal(true, { errorMap: () => ({ message: 'É necessário aceitar a Política de Privacidade' }) }),
  website: z.string().max(200).optional(), // honeypot anti-spam (a rota descarta se vier preenchido)
});
export type QuoteRequestInput = z.input<typeof quoteRequestSchema>;

// ----------------------------------------------------------------------------- Admin
const money = z.coerce.number().nonnegative().max(10_000_000);
const optionalMoney = z.preprocess((v) => (v === '' || v == null ? null : v), z.coerce.number().positive().nullable());

export const productAdminSchema = z
  .object({
    sku: z.string().trim().min(2).max(40).transform((s) => s.toUpperCase()),
    name: z.string().trim().min(3).max(200),
    slug: z.string().trim().max(200).optional().default(''),
    short_description: z.string().trim().max(300).optional().default(''),
    description: z.string().trim().max(5000).optional().default(''),
    category_id: z.string().uuid().nullable().optional(),
    brand_id: z.string().uuid().nullable().optional(),
    price: money.refine((v) => v > 0, 'Preço deve ser maior que zero'),
    promo_price: optionalMoney,
    promo_ends_at: z.preprocess((v) => (v === '' ? null : v), z.string().datetime({ offset: true }).nullable().optional()),
    unit: z.enum(['un', 'm', 'm2', 'm3', 'saco', 'caixa', 'barra', 'lata', 'rolo', 'kg', 'milheiro']),
    unit_label: z.string().trim().max(40).optional().default(''),
    min_qty: z.coerce.number().positive().default(1),
    qty_step: z.coerce.number().positive().default(1),
    stock: z.coerce.number().min(0),
    min_stock: z.coerce.number().min(0).default(5),
    weight_kg: z.coerce.number().min(0),
    length_cm: optionalMoney,
    width_cm: optionalMoney,
    height_cm: optionalMoney,
    specs: z.record(z.string().max(60), z.string().max(200)).default({}),
    is_featured: z.boolean().default(false),
    is_active: z.boolean().default(true),
    images: z.array(z.object({ url: z.string().min(1).max(500), alt: z.string().max(200).nullable().optional() })).max(10).default([]),
  })
  .refine((v) => v.promo_price == null || v.promo_price < v.price, { path: ['promo_price'], message: 'Preço promocional deve ser menor que o preço' });
export type ProductAdminInput = z.input<typeof productAdminSchema>;

export const importRowSchema = z.object({
  sku: z.string().trim().min(2).max(40).transform((s) => s.toUpperCase()),
  name: z.string().trim().min(3).max(200).optional(),
  price: z.coerce.number().positive().optional(),
  promo_price: optionalMoney.optional(),
  stock: z.coerce.number().min(0).optional(),
  unit: z.enum(['un', 'm', 'm2', 'm3', 'saco', 'caixa', 'barra', 'lata', 'rolo', 'kg', 'milheiro']).optional(),
  category: z.string().trim().optional(),
  brand: z.string().trim().optional(),
  weight_kg: z.coerce.number().min(0).optional(),
  short_description: z.string().trim().max(300).optional(),
});

export const orderStatusUpdateSchema = z.object({
  status: z.enum(['aguardando_pagamento', 'pago', 'em_separacao', 'saiu_para_entrega', 'entregue', 'cancelado']),
  note: z.string().trim().max(500).optional(),
  notify: z.boolean().default(true),
});

export const quoteResponseSchema = z.object({
  items: z.array(z.object({ id: z.string().uuid(), unit_price: z.coerce.number().nonnegative() })).min(1),
  discount: money.default(0),
  shipping_cost: money.default(0),
  valid_until: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  response_message: z.string().trim().max(2000).optional().default(''),
  admin_notes: z.string().trim().max(2000).optional().default(''),
  action: z.enum(['responder', 'converter', 'recusar']),
});
