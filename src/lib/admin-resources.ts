import { z } from 'zod';
import { slugify } from './utils';

/**
 * Recursos "simples" do painel, todos geridos pelo mesmo componente (ResourceManager)
 * e pela mesma rota (/api/admin/recursos/[recurso]). A validação Zod roda no cliente e no servidor.
 */
export type FieldType = 'text' | 'textarea' | 'number' | 'boolean' | 'datetime' | 'list' | 'select';
export interface ResourceField {
  name: string;
  label: string;
  type: FieldType;
  options?: { value: string; label: string }[];
  hint?: string;
  showInTable?: boolean;
}

const emptyToNull = (v: unknown) => (v === '' || v === undefined ? null : v);
const optNumber = z.preprocess(emptyToNull, z.coerce.number().nonnegative().nullable());
const optDate = z.preprocess(emptyToNull, z.string().datetime({ offset: true }).nullable());
const optText = z.preprocess(emptyToNull, z.string().trim().max(2000).nullable());
const cities = z.preprocess(
  (v) => (typeof v === 'string' ? v.split(/[,;\n]/).map((s) => s.trim()).filter(Boolean) : v),
  z.array(z.string().min(2).max(80)).min(1, 'Informe ao menos uma cidade'),
);

export const resources = {
  categorias: {
    table: 'categories',
    title: 'Categorias',
    order: 'sort_order',
    fields: [
      { name: 'name', label: 'Nome', type: 'text', showInTable: true },
      { name: 'slug', label: 'Slug', type: 'text', hint: 'Gerado do nome se vazio', showInTable: true },
      { name: 'description', label: 'Descrição', type: 'textarea' },
      { name: 'icon', label: 'Ícone', type: 'select', options: ['cimento', 'hidraulica', 'eletrica', 'ferramentas', 'tintas', 'pisos', 'telhas', 'ferragens'].map((v) => ({ value: v, label: v })) },
      { name: 'sort_order', label: 'Ordem', type: 'number', showInTable: true },
      { name: 'active', label: 'Ativa', type: 'boolean', showInTable: true },
    ],
    schema: z
      .object({ name: z.string().trim().min(2).max(80), slug: z.string().trim().max(80).optional(), description: optText, icon: optText, sort_order: z.coerce.number().int().default(0), active: z.boolean().default(true) })
      .transform((v) => ({ ...v, slug: v.slug || slugify(v.name) })),
  },
  marcas: {
    table: 'brands',
    title: 'Marcas',
    order: 'name',
    fields: [
      { name: 'name', label: 'Nome', type: 'text', showInTable: true },
      { name: 'slug', label: 'Slug', type: 'text', showInTable: true },
      { name: 'logo_url', label: 'URL do logo', type: 'text', hint: 'Envie o logo ao Storage e cole a URL pública' },
      { name: 'active', label: 'Ativa', type: 'boolean', showInTable: true },
    ],
    schema: z
      .object({ name: z.string().trim().min(2).max(80), slug: z.string().trim().max(80).optional(), logo_url: z.preprocess(emptyToNull, z.string().url().nullable()), active: z.boolean().default(true) })
      .transform((v) => ({ ...v, slug: v.slug || slugify(v.name) })),
  },
  cupons: {
    table: 'coupons',
    title: 'Cupons de desconto',
    order: 'created_at',
    fields: [
      { name: 'code', label: 'Código', type: 'text', showInTable: true },
      { name: 'description', label: 'Descrição', type: 'text', showInTable: true },
      { name: 'type', label: 'Tipo', type: 'select', options: [{ value: 'percentual', label: 'Percentual (%)' }, { value: 'valor_fixo', label: 'Valor fixo (R$)' }, { value: 'frete_gratis', label: 'Frete grátis' }], showInTable: true },
      { name: 'value', label: 'Valor', type: 'number', showInTable: true },
      { name: 'min_order_value', label: 'Pedido mínimo (R$)', type: 'number' },
      { name: 'max_uses', label: 'Limite de usos', type: 'number', hint: 'Vazio = ilimitado' },
      { name: 'used_count', label: 'Usos', type: 'number', showInTable: true },
      { name: 'starts_at', label: 'Início', type: 'datetime' },
      { name: 'ends_at', label: 'Fim', type: 'datetime', showInTable: true },
      { name: 'active', label: 'Ativo', type: 'boolean', showInTable: true },
    ],
    schema: z
      .object({
        code: z.string().trim().min(3).max(30).regex(/^[A-Za-z0-9_-]+$/, 'Use letras, números, - ou _').transform((s) => s.toUpperCase()),
        description: optText,
        type: z.enum(['percentual', 'valor_fixo', 'frete_gratis']),
        value: z.coerce.number().nonnegative(),
        min_order_value: z.coerce.number().nonnegative().default(0),
        max_uses: z.preprocess(emptyToNull, z.coerce.number().int().positive().nullable()),
        used_count: z.coerce.number().int().nonnegative().optional(),
        starts_at: optDate,
        ends_at: optDate,
        active: z.boolean().default(true),
      })
      .refine((v) => v.type !== 'percentual' || v.value <= 100, { path: ['value'], message: 'Percentual máximo: 100' }),
  },
  banners: {
    table: 'banners',
    title: 'Banners de ofertas',
    order: 'sort_order',
    fields: [
      { name: 'title', label: 'Título', type: 'text', showInTable: true },
      { name: 'subtitle', label: 'Subtítulo', type: 'text' },
      { name: 'placement', label: 'Posição', type: 'select', options: [{ value: 'ofertas', label: 'Seção Ofertas da semana' }, { value: 'hero', label: 'Hero' }], showInTable: true },
      { name: 'link_url', label: 'Link', type: 'text' },
      { name: 'cta_label', label: 'Texto do botão', type: 'text' },
      { name: 'image_url', label: 'URL da imagem', type: 'text' },
      { name: 'starts_at', label: 'Início', type: 'datetime' },
      { name: 'ends_at', label: 'Fim (usado no contador)', type: 'datetime', showInTable: true },
      { name: 'sort_order', label: 'Ordem', type: 'number' },
      { name: 'active', label: 'Ativo', type: 'boolean', showInTable: true },
    ],
    schema: z.object({
      title: z.string().trim().min(2).max(120),
      subtitle: optText,
      placement: z.enum(['ofertas', 'hero']).default('ofertas'),
      link_url: optText,
      cta_label: optText,
      image_url: optText,
      starts_at: optDate,
      ends_at: optDate,
      sort_order: z.coerce.number().int().default(0),
      active: z.boolean().default(true),
    }),
  },
  entregas: {
    table: 'delivery_zones',
    title: 'Zonas e tarifas de entrega',
    order: 'sort_order',
    fields: [
      { name: 'name', label: 'Nome da zona', type: 'text', showInTable: true },
      { name: 'cities', label: 'Cidades atendidas', type: 'list', hint: 'Separe por vírgula, exatamente como no ViaCEP (com acentos)', showInTable: true },
      { name: 'state', label: 'UF', type: 'text' },
      { name: 'base_price', label: 'Tarifa base (R$)', type: 'number', showInTable: true },
      { name: 'price_per_kg', label: 'R$ por kg', type: 'number', showInTable: true },
      { name: 'free_above', label: 'Frete grátis acima de (R$)', type: 'number', showInTable: true },
      { name: 'max_weight_kg', label: 'Peso máximo (kg)', type: 'number' },
      { name: 'delivery_days', label: 'Prazo (dias úteis)', type: 'number', showInTable: true },
      { name: 'sort_order', label: 'Ordem', type: 'number' },
      { name: 'active', label: 'Ativa', type: 'boolean', showInTable: true },
    ],
    schema: z.object({
      name: z.string().trim().min(2).max(80),
      cities,
      state: z.string().trim().length(2).transform((s) => s.toUpperCase()).default('RS'),
      base_price: z.coerce.number().nonnegative(),
      price_per_kg: z.coerce.number().nonnegative(),
      free_above: optNumber,
      max_weight_kg: optNumber,
      delivery_days: z.coerce.number().int().min(0).max(60),
      sort_order: z.coerce.number().int().default(0),
      active: z.boolean().default(true),
    }),
  },
} satisfies Record<string, { table: string; title: string; order: string; fields: ResourceField[]; schema: z.ZodTypeAny }>;

export type ResourceKey = keyof typeof resources;
export const isResourceKey = (k: string): k is ResourceKey => k in resources;
