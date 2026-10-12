/**
 * Dados institucionais da E Michelin e Cia.
 * ⚠️ Campos marcados com TODO são placeholders: confirme com a loja antes de publicar.
 */
export const site = {
  name: 'E Michelin e Cia',
  legalName: 'E Michelin e Cia Ltda', // TODO: confirmar razão social
  cnpj: process.env.NEXT_PUBLIC_STORE_CNPJ ?? '00.000.000/0001-00', // TODO: CNPJ real
  title: 'Material de Construção em Erechim | E Michelin e Cia',
  description:
    'Materiais de construção, hidráulica, elétrica, ferramentas e tintas em Erechim/RS. Compre online com entrega rápida em Erechim e região ou retire na loja. Pix, cartão em até 10x e boleto.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  phone: '(54) 3321-5455',
  phoneE164: '+555433215455',
  whatsapp: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '5554999999999', // TODO: número real (DDI+DDD+número)
  email: process.env.NEXT_PUBLIC_STORE_EMAIL ?? 'contato@emichelin.com.br', // TODO
  address: {
    street: 'Rua Distrito Federal, 509',
    district: 'Centro',
    city: 'Erechim',
    state: 'RS',
    cep: '99700-000',
    full: 'Distrito Federal, 509 – Centro, Erechim – RS, 99700-000',
  },
  geo: { lat: -27.6399907, lng: -52.2659816 },
  // TODO: confirmar horários
  hours: [
    { days: 'Segunda a sexta', time: '7h30 às 18h', schema: { days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], opens: '07:30', closes: '18:00' } },
    { days: 'Sábado', time: '8h às 12h', schema: { days: ['Saturday'], opens: '08:00', closes: '12:00' } },
    { days: 'Domingo e feriados', time: 'Fechado', schema: null },
  ],
  social: {
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? 'https://instagram.com/', // TODO
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL ?? 'https://facebook.com/', // TODO
  },
  foundedYear: Number(process.env.NEXT_PUBLIC_FOUNDED_YEAR ?? 1985), // TODO: ano de fundação real
  stats: { customers: 25000, products: 8000 }, // TODO: números reais
  deliveryRegion: [
    'Erechim', 'Getúlio Vargas', 'Barão de Cotegipe', 'Gaurama', 'Áurea', 'Paulo Bento',
    'Erebango', 'Estação', 'Jacutinga', 'Aratiba', 'Marcelino Ramos', 'Campinas do Sul', 'Severiano de Almeida',
  ],
  pickupReadyHours: 2,
  maxInstallments: 10,
  minInstallmentValue: 50,
} as const;

export const whatsappLink = (text?: string) =>
  `https://wa.me/${site.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

export const mapsEmbedUrl = `https://www.google.com/maps?q=${site.geo.lat},${site.geo.lng}&z=17&hl=pt-BR&output=embed`;
export const mapsDirectionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${site.geo.lat},${site.geo.lng}`;
