/**
 * Catálogo de exemplo (fonte única).
 * - Usado como fallback de leitura quando o Supabase ainda não está configurado (modo demonstração).
 * - `npm run db:seed:generate` transforma este arquivo em supabase/seed.sql.
 * - `npm run images:generate` cria as ilustrações SVG em public/images/produtos.
 * Este arquivo não pode importar valores de outros módulos (é executado direto pelo Node).
 */
import type { SaleUnit } from '@/types';

export const uid = (prefix: string, n: number) =>
  `${prefix}-0000-4000-8000-${n.toString(16).padStart(12, '0')}`;

export const categoriesData = [
  { id: uid('00000000', 1), slug: 'cimento-e-argamassa', name: 'Cimento e Argamassa', icon: 'cimento', description: 'Cimento, argamassas, cal, areia, blocos e tudo para a estrutura da obra.' },
  { id: uid('00000000', 2), slug: 'hidraulica', name: 'Hidráulica', icon: 'hidraulica', description: 'Tubos, conexões, registros, caixas d’água e metais sanitários.' },
  { id: uid('00000000', 3), slug: 'eletrica', name: 'Elétrica', icon: 'eletrica', description: 'Fios, cabos, disjuntores, tomadas, interruptores e chuveiros.' },
  { id: uid('00000000', 4), slug: 'ferramentas', name: 'Ferramentas', icon: 'ferramentas', description: 'Ferramentas manuais e elétricas para profissionais e para o dia a dia.' },
  { id: uid('00000000', 5), slug: 'tintas', name: 'Tintas', icon: 'tintas', description: 'Tintas, massas, seladores e acessórios de pintura.' },
  { id: uid('00000000', 6), slug: 'pisos-e-revestimentos', name: 'Pisos e Revestimentos', icon: 'pisos', description: 'Porcelanatos, cerâmicas e revestimentos para todos os ambientes.' },
  { id: uid('00000000', 7), slug: 'telhas', name: 'Telhas', icon: 'telhas', description: 'Telhas cerâmicas, de fibrocimento e acessórios de cobertura.' },
  { id: uid('00000000', 8), slug: 'ferragens', name: 'Ferragens', icon: 'ferragens', description: 'Vergalhões, arames, pregos, parafusos e ferragens em geral.' },
] as const;

export const brandsData = [
  'Tigre', 'Amanco', 'Votorantim', 'Suvinil', 'Coral', 'Quartzolit', 'Gerdau', 'Tramontina', 'Docol',
  'Fortlev', 'Lorenzetti', 'Pial Legrand', 'SIL', 'Vonder', 'Portobello', 'Eliane', 'Brasilit', 'Deca',
].map((name, i) => ({
  id: uid('b0000000', i + 1),
  slug: name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, '-'),
  name,
}));

const cat = (slug: string) => categoriesData.find((c) => c.slug === slug)!.id;
const brand = (name: string | null) => (name ? brandsData.find((b) => b.name === name)!.id : null);

export interface RawProduct {
  sku: string;
  slug: string;
  name: string;
  short: string;
  description: string;
  category: string;
  brand: string | null; // null = produto sem marca (agregados, cerâmica vermelha)
  price: number;
  promo?: number;
  promoDays?: number;
  unit: SaleUnit;
  unitLabel?: string;
  minQty?: number;
  qtyStep?: number;
  stock: number;
  minStock?: number;
  weight: number;
  dims?: [number, number, number]; // C x L x A em cm
  specs: Record<string, string>;
  featured?: boolean;
  sold: number;
}

export const rawProducts: RawProduct[] = [
  // ---------------------------------------------------------------- Cimento e Argamassa
  {
    sku: 'CIM-CPII-50', slug: 'cimento-cp-ii-f-32-votorantim-50kg', name: 'Cimento CP II-F-32 Votorantim 50 kg',
    short: 'Cimento Portland composto, ideal para concreto, reboco, contrapiso e assentamento.',
    description: 'O Cimento CP II-F-32 é o mais versátil da obra: indicado para concretos estruturais, argamassas de assentamento e revestimento, contrapisos e pré-moldados. Armazene em local seco, sobre estrados e em pilhas de até 10 sacos.',
    category: 'cimento-e-argamassa', brand: 'Votorantim', price: 38.9, promo: 34.9, promoDays: 6,
    unit: 'saco', unitLabel: 'saco 50 kg', stock: 420, minStock: 60, weight: 50, dims: [60, 40, 12],
    specs: { Tipo: 'CP II-F-32', Peso: '50 kg', Norma: 'NBR 16697', Validade: '90 dias' }, featured: true, sold: 1840,
  },
  {
    sku: 'CIM-CPV-50', slug: 'cimento-cp-v-ari-votorantim-50kg', name: 'Cimento CP V-ARI Votorantim 50 kg',
    short: 'Alta resistência inicial: desforma rápida para pré-moldados e estruturas.',
    description: 'Cimento de alta resistência inicial (ARI), indicado para pré-fabricados, artefatos de concreto e situações em que a desforma rápida é necessária.',
    category: 'cimento-e-argamassa', brand: 'Votorantim', price: 44.9,
    unit: 'saco', unitLabel: 'saco 50 kg', stock: 180, minStock: 30, weight: 50, dims: [60, 40, 12],
    specs: { Tipo: 'CP V-ARI', Peso: '50 kg', Norma: 'NBR 16697' }, sold: 620,
  },
  {
    sku: 'ARG-ACIII-20', slug: 'argamassa-ac-iii-quartzolit-20kg', name: 'Argamassa AC-III Cinza Quartzolit 20 kg',
    short: 'Para porcelanatos e peças grandes em áreas internas e externas.',
    description: 'Argamassa colante tipo AC-III de alta aderência, indicada para assentamento de porcelanatos, peças de grande formato, fachadas e piscinas. Rendimento aproximado de 4 a 5 kg/m² em dupla colagem.',
    category: 'cimento-e-argamassa', brand: 'Quartzolit', price: 34.9, promo: 29.9, promoDays: 6,
    unit: 'saco', unitLabel: 'saco 20 kg', stock: 260, minStock: 40, weight: 20, dims: [45, 30, 10],
    specs: { Tipo: 'AC-III', Cor: 'Cinza', Peso: '20 kg', Rendimento: '4 a 5 kg/m²', 'Tempo em aberto': '30 min' }, featured: true, sold: 1210,
  },
  {
    sku: 'ARG-ACI-20', slug: 'argamassa-ac-i-quartzolit-20kg', name: 'Argamassa AC-I Interno Quartzolit 20 kg',
    short: 'Para cerâmicas em pisos e paredes de áreas internas.',
    description: 'Argamassa colante AC-I para assentamento de cerâmicas em áreas internas. Fácil preparo, basta adicionar água.',
    category: 'cimento-e-argamassa', brand: 'Quartzolit', price: 14.9,
    unit: 'saco', unitLabel: 'saco 20 kg', stock: 310, minStock: 40, weight: 20, dims: [45, 30, 10],
    specs: { Tipo: 'AC-I', Uso: 'Interno', Peso: '20 kg', Rendimento: '4 a 5 kg/m²' }, sold: 980,
  },
  {
    sku: 'ARG-ASSENT-20', slug: 'argamassa-assentamento-quartzolit-20kg', name: 'Argamassa de Assentamento Quartzolit 20 kg',
    short: 'Pronta para assentar blocos cerâmicos e de concreto.',
    description: 'Argamassa industrializada para assentamento de alvenaria de vedação. Dispensa cal e areia: mais produtividade e menos desperdício no canteiro.',
    category: 'cimento-e-argamassa', brand: 'Quartzolit', price: 19.9,
    unit: 'saco', unitLabel: 'saco 20 kg', stock: 140, minStock: 30, weight: 20, dims: [45, 30, 10],
    specs: { Uso: 'Assentamento de alvenaria', Peso: '20 kg', Rendimento: 'aprox. 10 kg/m² (bloco 9 cm)' }, sold: 410,
  },
  {
    sku: 'CAL-CHIII-20', slug: 'cal-hidratada-ch-iii-20kg', name: 'Cal Hidratada CH-III 20 kg',
    short: 'Melhora a trabalhabilidade de rebocos e argamassas.',
    description: 'Cal hidratada CH-III para argamassas de assentamento e revestimento, proporcionando maior plasticidade e retenção de água.',
    category: 'cimento-e-argamassa', brand: 'Votorantim', price: 16.9,
    unit: 'saco', unitLabel: 'saco 20 kg', stock: 95, minStock: 20, weight: 20, dims: [45, 30, 10],
    specs: { Tipo: 'CH-III', Peso: '20 kg' }, sold: 350,
  },
  {
    sku: 'REJ-FLEX-1', slug: 'rejunte-flexivel-cinza-platina-quartzolit-1kg', name: 'Rejunte Flexível Cinza Platina Quartzolit 1 kg',
    short: 'Flexível e impermeável, para juntas de 2 a 10 mm.',
    description: 'Rejunte flexível com aditivos antifungo, indicado para pisos e paredes internos e externos, inclusive áreas molhadas.',
    category: 'cimento-e-argamassa', brand: 'Quartzolit', price: 12.9,
    unit: 'un', unitLabel: 'pacote 1 kg', stock: 230, minStock: 30, weight: 1, dims: [20, 12, 5],
    specs: { Cor: 'Cinza platina', Peso: '1 kg', Juntas: '2 a 10 mm' }, sold: 760,
  },
  {
    sku: 'ARE-MED-M3', slug: 'areia-media-lavada-m3', name: 'Areia Média Lavada (m³)',
    short: 'Para concreto, reboco e contrapiso. Entrega a granel.',
    description: 'Areia média lavada de rio, peneirada, para concreto, argamassas de revestimento e contrapiso. Vendida por metro cúbico e entregue a granel em caminhão basculante.',
    category: 'cimento-e-argamassa', brand: null, price: 189,
    unit: 'm3', unitLabel: 'm³', minQty: 0.5, qtyStep: 0.5, stock: 80, minStock: 10, weight: 1500,
    specs: { Granulometria: 'Média', Origem: 'Rio', Entrega: 'A granel' }, sold: 290,
  },
  {
    sku: 'BLO-CER-9', slug: 'bloco-ceramico-6-furos-9x14x24', name: 'Tijolo Cerâmico 6 Furos 9×14×24 cm',
    short: 'Tijolo de vedação para paredes internas e externas.',
    description: 'Tijolo cerâmico de 6 furos para alvenaria de vedação. Aproximadamente 25 peças por m² de parede com junta de 1 cm. Venda mínima de 100 unidades.',
    category: 'cimento-e-argamassa', brand: null, price: 1.35,
    unit: 'un', unitLabel: 'unidade', minQty: 100, qtyStep: 50, stock: 18000, minStock: 2000, weight: 2.4, dims: [24, 9, 14],
    specs: { Dimensões: '9 × 14 × 24 cm', Furos: '6', Consumo: '≈ 25 un/m²' }, featured: true, sold: 52000,
  },
  {
    sku: 'BLO-CON-14', slug: 'bloco-de-concreto-14x19x39', name: 'Bloco de Concreto Estrutural 14×19×39 cm',
    short: 'Bloco vazado para alvenaria estrutural e muros.',
    description: 'Bloco de concreto vazado classe B para alvenaria estrutural, muros e galpões. Aproximadamente 12,5 peças por m².',
    category: 'cimento-e-argamassa', brand: null, price: 3.9,
    unit: 'un', unitLabel: 'unidade', minQty: 50, qtyStep: 10, stock: 6200, minStock: 500, weight: 11, dims: [39, 14, 19],
    specs: { Dimensões: '14 × 19 × 39 cm', Classe: 'B', Consumo: '≈ 12,5 un/m²' }, sold: 9400,
  },
  // ---------------------------------------------------------------- Hidráulica
  {
    sku: 'TUB-SOL-25', slug: 'tubo-pvc-soldavel-25mm-6m-tigre', name: 'Tubo PVC Soldável 25 mm × 6 m Tigre',
    short: 'Para instalações de água fria predial.',
    description: 'Tubo de PVC rígido soldável marrom, para condução de água fria em instalações prediais. Pressão de serviço de 7,5 kgf/cm².',
    category: 'hidraulica', brand: 'Tigre', price: 32.9, promo: 27.9, promoDays: 6,
    unit: 'barra', unitLabel: 'barra 6 m', stock: 340, minStock: 40, weight: 2.4, dims: [600, 3, 3],
    specs: { Diâmetro: '25 mm (3/4")', Comprimento: '6 m', Norma: 'NBR 5648', Cor: 'Marrom' }, featured: true, sold: 1320,
  },
  {
    sku: 'TUB-ESG-100', slug: 'tubo-pvc-esgoto-100mm-6m-tigre', name: 'Tubo PVC Esgoto Série Normal 100 mm × 6 m Tigre',
    short: 'Para esgoto predial e águas pluviais.',
    description: 'Tubo de PVC branco para sistemas prediais de esgoto sanitário e ventilação. Junta soldável ou elástica.',
    category: 'hidraulica', brand: 'Tigre', price: 89.9,
    unit: 'barra', unitLabel: 'barra 6 m', stock: 120, minStock: 20, weight: 8.6, dims: [600, 10, 10],
    specs: { Diâmetro: '100 mm', Comprimento: '6 m', Norma: 'NBR 5688' }, sold: 540,
  },
  {
    sku: 'JOE-SOL-25', slug: 'joelho-90-soldavel-25mm-tigre', name: 'Joelho 90° Soldável 25 mm Tigre',
    short: 'Conexão para mudança de direção em água fria.',
    description: 'Joelho 90° de PVC soldável para instalações de água fria.',
    category: 'hidraulica', brand: 'Tigre', price: 1.89,
    unit: 'un', unitLabel: 'unidade', stock: 1500, minStock: 150, weight: 0.03, dims: [5, 5, 5],
    specs: { Diâmetro: '25 mm', Ângulo: '90°' }, sold: 6100,
  },
  {
    sku: 'REG-GAV-34', slug: 'registro-gaveta-3-4-docol', name: 'Registro de Gaveta Bruto 3/4" Docol',
    short: 'Corpo em metal, para controle de fluxo de água.',
    description: 'Registro de gaveta bruto em liga de cobre, rosca 3/4", para instalação embutida. Acabamento vendido separadamente.',
    category: 'hidraulica', brand: 'Docol', price: 49.9,
    unit: 'un', unitLabel: 'unidade', stock: 85, minStock: 15, weight: 0.45, dims: [12, 8, 8],
    specs: { Bitola: '3/4"', Material: 'Liga de cobre', Tipo: 'Gaveta' }, sold: 430,
  },
  {
    sku: 'CXA-POL-1000', slug: 'caixa-dagua-polietileno-1000l-fortlev', name: 'Caixa d’Água de Polietileno 1.000 L Fortlev',
    short: 'Leve, atóxica e com tampa de encaixe.',
    description: 'Caixa d’água em polietileno com proteção UV, atóxica e com tampa de rosca fácil. Acompanha manual de instalação.',
    category: 'hidraulica', brand: 'Fortlev', price: 489, promo: 439, promoDays: 6,
    unit: 'un', unitLabel: 'unidade', stock: 14, minStock: 5, weight: 18, dims: [146, 146, 76],
    specs: { Capacidade: '1.000 L', Material: 'Polietileno', Altura: '76 cm', Diâmetro: '1,46 m' }, featured: true, sold: 210,
  },
  {
    sku: 'ADE-PVC-175', slug: 'adesivo-plastico-pvc-175g-tigre', name: 'Adesivo Plástico para PVC 175 g Tigre',
    short: 'Cola para tubos e conexões soldáveis.',
    description: 'Adesivo para soldagem a frio de tubos e conexões de PVC rígido. Bisnaga de 175 g.',
    category: 'hidraulica', brand: 'Tigre', price: 21.9,
    unit: 'un', unitLabel: 'bisnaga 175 g', stock: 160, minStock: 20, weight: 0.2, dims: [18, 5, 5],
    specs: { Conteúdo: '175 g' }, sold: 880,
  },
  {
    sku: 'TUB-PPR-25', slug: 'tubo-ppr-agua-quente-25mm-3m-amanco', name: 'Tubo PPR Água Quente 25 mm × 3 m Amanco',
    short: 'Termofusão para água quente e fria.',
    description: 'Tubo PPR (polipropileno copolímero random) para instalações de água quente e fria, unido por termofusão.',
    category: 'hidraulica', brand: 'Amanco', price: 54.9,
    unit: 'barra', unitLabel: 'barra 3 m', stock: 4, minStock: 10, weight: 1.6, dims: [300, 3, 3],
    specs: { Diâmetro: '25 mm', Comprimento: '3 m', 'Temperatura máx.': '80 °C' }, sold: 190,
  },
  {
    sku: 'VED-ROS-18', slug: 'fita-veda-rosca-18mm-50m-tigre', name: 'Fita Veda Rosca 18 mm × 50 m Tigre',
    short: 'Vedação de conexões roscáveis.',
    description: 'Fita de PTFE para vedação de roscas em instalações hidráulicas.',
    category: 'hidraulica', brand: 'Tigre', price: 9.9,
    unit: 'rolo', unitLabel: 'rolo 50 m', stock: 400, minStock: 40, weight: 0.05, dims: [8, 8, 2],
    specs: { Largura: '18 mm', Comprimento: '50 m' }, sold: 1500,
  },
  // ---------------------------------------------------------------- Elétrica
  {
    sku: 'CAB-FLEX-25', slug: 'cabo-flexivel-2-5mm-750v-sil-metro', name: 'Cabo Flexível 2,5 mm² 750 V SIL (metro)',
    short: 'Vendido por metro, ideal para tomadas de uso geral.',
    description: 'Cabo flexível de cobre com isolação em PVC antichama 750 V. Vendido por metro linear — informe a metragem desejada.',
    category: 'eletrica', brand: 'SIL', price: 3.49,
    unit: 'm', unitLabel: 'metro', minQty: 5, qtyStep: 1, stock: 2400, minStock: 300, weight: 0.03,
    specs: { Seção: '2,5 mm²', Tensão: '750 V', Material: 'Cobre', Norma: 'NBR NM 247-3' }, sold: 18500,
  },
  {
    sku: 'CAB-FLEX-25-100', slug: 'cabo-flexivel-2-5mm-750v-sil-rolo-100m', name: 'Cabo Flexível 2,5 mm² 750 V SIL — Rolo 100 m',
    short: 'Rolo fechado com 100 metros.',
    description: 'Rolo de 100 m de cabo flexível de cobre 2,5 mm², isolação antichama 750 V.',
    category: 'eletrica', brand: 'SIL', price: 299, promo: 269, promoDays: 6,
    unit: 'rolo', unitLabel: 'rolo 100 m', stock: 38, minStock: 8, weight: 3.1, dims: [30, 30, 10],
    specs: { Seção: '2,5 mm²', Comprimento: '100 m', Tensão: '750 V' }, featured: true, sold: 640,
  },
  {
    sku: 'DIS-MONO-20', slug: 'disjuntor-din-monopolar-20a-pial-legrand', name: 'Disjuntor DIN Monopolar 20 A Pial Legrand',
    short: 'Curva C, 3 kA, padrão DIN.',
    description: 'Disjuntor termomagnético monopolar 20 A, curva C, para proteção de circuitos de tomadas e iluminação.',
    category: 'eletrica', brand: 'Pial Legrand', price: 17.9,
    unit: 'un', unitLabel: 'unidade', stock: 210, minStock: 20, weight: 0.12, dims: [9, 2, 7],
    specs: { Corrente: '20 A', Curva: 'C', Polos: '1', Capacidade: '3 kA' }, sold: 920,
  },
  {
    sku: 'TOM-2PT-10', slug: 'tomada-2p-t-10a-com-placa-pial-legrand', name: 'Tomada 2P+T 10 A com Placa 4×2 Pial Legrand',
    short: 'Padrão brasileiro NBR 14136, branca.',
    description: 'Conjunto de tomada 2P+T 10 A com placa 4×2 e suporte, linha residencial, cor branca.',
    category: 'eletrica', brand: 'Pial Legrand', price: 14.9,
    unit: 'un', unitLabel: 'unidade', stock: 3, minStock: 20, weight: 0.08, dims: [12, 8, 4],
    specs: { Corrente: '10 A', Padrão: 'NBR 14136', Cor: 'Branca' }, sold: 1100,
  },
  {
    sku: 'CHU-ACQ-7800', slug: 'chuveiro-acqua-duo-7800w-220v-lorenzetti', name: 'Chuveiro Acqua Duo Ultra 7800 W 220 V Lorenzetti',
    short: 'Pressurizável, com controle eletrônico de temperatura.',
    description: 'Chuveiro eletrônico com controle de temperatura, espalhador de 22 cm e tecnologia para alta e baixa pressão.',
    category: 'eletrica', brand: 'Lorenzetti', price: 279,
    unit: 'un', unitLabel: 'unidade', stock: 22, minStock: 5, weight: 1.6, dims: [35, 25, 15],
    specs: { Potência: '7800 W', Tensão: '220 V', Controle: 'Eletrônico' }, featured: true, sold: 360,
  },
  // ---------------------------------------------------------------- Ferramentas
  {
    sku: 'FUR-IMP-650', slug: 'furadeira-de-impacto-650w-vonder', name: 'Furadeira de Impacto 650 W 1/2" Vonder',
    short: 'Com velocidade variável e reversível.',
    description: 'Furadeira de impacto com mandril 1/2", velocidade variável, reversão e empunhadura auxiliar. Ideal para alvenaria, madeira e metal.',
    category: 'ferramentas', brand: 'Vonder', price: 249.9, promo: 219.9, promoDays: 6,
    unit: 'un', unitLabel: 'unidade', stock: 16, minStock: 4, weight: 2.1, dims: [32, 9, 25],
    specs: { Potência: '650 W', Mandril: '1/2" (13 mm)', Tensão: '127 V', Garantia: '6 meses' }, featured: true, sold: 240,
  },
  {
    sku: 'COL-PED-8', slug: 'colher-de-pedreiro-8-tramontina', name: 'Colher de Pedreiro 8" Tramontina',
    short: 'Lâmina em aço, cabo de madeira.',
    description: 'Colher de pedreiro com lâmina de aço carbono temperado e cabo de madeira envernizado.',
    category: 'ferramentas', brand: 'Tramontina', price: 29.9,
    unit: 'un', unitLabel: 'unidade', stock: 64, minStock: 10, weight: 0.35, dims: [33, 12, 6],
    specs: { Tamanho: '8"', Material: 'Aço carbono' }, sold: 470,
  },
  {
    sku: 'CAR-MAO-60', slug: 'carrinho-de-mao-60l-tramontina', name: 'Carrinho de Mão Metálico 60 L Tramontina',
    short: 'Caçamba reforçada com pneu e câmara.',
    description: 'Carrinho de mão com caçamba metálica de 60 litros, chassi tubular e roda com pneu e câmara.',
    category: 'ferramentas', brand: 'Tramontina', price: 249,
    unit: 'un', unitLabel: 'unidade', stock: 9, minStock: 3, weight: 14, dims: [140, 60, 55],
    specs: { Capacidade: '60 L', Roda: 'Pneu com câmara' }, sold: 130,
  },
  {
    sku: 'NIV-ALU-40', slug: 'nivel-de-aluminio-40cm-vonder', name: 'Nível de Alumínio 40 cm Vonder',
    short: '3 bolhas, perfil em alumínio.',
    description: 'Nível de alumínio com três ampolas para medições horizontais, verticais e a 45°.',
    category: 'ferramentas', brand: 'Vonder', price: 39.9,
    unit: 'un', unitLabel: 'unidade', stock: 41, minStock: 8, weight: 0.4, dims: [40, 6, 3],
    specs: { Comprimento: '40 cm', Ampolas: '3' }, sold: 260,
  },
  // ---------------------------------------------------------------- Tintas
  {
    sku: 'TIN-SUV-18', slug: 'tinta-acrilica-suvinil-fosco-completo-branco-18l', name: 'Tinta Acrílica Fosco Completo Branco 18 L Suvinil',
    short: 'Premium, lavável, rende até 380 m² por demão.',
    description: 'Tinta acrílica premium fosca para paredes internas e externas. Alta cobertura, lavável e com proteção antimofo.',
    category: 'tintas', brand: 'Suvinil', price: 459, promo: 399, promoDays: 6,
    unit: 'lata', unitLabel: 'lata 18 L', stock: 26, minStock: 6, weight: 24, dims: [30, 30, 36],
    specs: { Acabamento: 'Fosco', Volume: '18 L', Rendimento: 'até 380 m²/demão', Linha: 'Premium' }, featured: true, sold: 310,
  },
  {
    sku: 'TIN-COR-18', slug: 'tinta-acrilica-coral-rende-muito-branco-18l', name: 'Tinta Acrílica Rende Muito Branco 18 L Coral',
    short: 'Standard, ótimo custo-benefício para áreas internas.',
    description: 'Tinta acrílica standard fosca com bom rendimento, indicada para paredes internas e externas.',
    category: 'tintas', brand: 'Coral', price: 289,
    unit: 'lata', unitLabel: 'lata 18 L', stock: 31, minStock: 6, weight: 24, dims: [30, 30, 36],
    specs: { Acabamento: 'Fosco', Volume: '18 L', Rendimento: 'até 275 m²/demão' }, sold: 420,
  },
  {
    sku: 'TIN-COR-36', slug: 'tinta-acrilica-coral-rende-muito-branco-3-6l', name: 'Tinta Acrílica Rende Muito Branco 3,6 L Coral',
    short: 'Galão para pequenos ambientes e retoques.',
    description: 'Tinta acrílica standard fosca em galão de 3,6 L.',
    category: 'tintas', brand: 'Coral', price: 79.9,
    unit: 'lata', unitLabel: 'galão 3,6 L', stock: 58, minStock: 10, weight: 5, dims: [17, 17, 19],
    specs: { Acabamento: 'Fosco', Volume: '3,6 L', Rendimento: 'até 55 m²/demão' }, sold: 690,
  },
  {
    sku: 'MAS-COR-25', slug: 'massa-corrida-pva-suvinil-25kg', name: 'Massa Corrida PVA 25 kg Suvinil',
    short: 'Nivela e corrige imperfeições em paredes internas.',
    description: 'Massa corrida PVA para nivelar e corrigir imperfeições de superfícies internas de reboco, concreto e gesso.',
    category: 'tintas', brand: 'Suvinil', price: 89.9,
    unit: 'lata', unitLabel: 'balde 25 kg', stock: 44, minStock: 8, weight: 25, dims: [30, 30, 32],
    specs: { Tipo: 'PVA', Peso: '25 kg', Uso: 'Interno' }, sold: 280,
  },
  {
    sku: 'ROL-LA-23', slug: 'rolo-de-la-23cm-tigre', name: 'Rolo de Lã Sintética 23 cm com Cabo Tigre',
    short: 'Para tintas acrílicas e PVA em superfícies lisas e rugosas.',
    description: 'Rolo de lã sintética de 23 cm com cabo, indicado para tintas à base d’água.',
    category: 'tintas', brand: 'Tigre', price: 34.9,
    unit: 'un', unitLabel: 'unidade', stock: 75, minStock: 10, weight: 0.3, dims: [30, 10, 8],
    specs: { Largura: '23 cm', Material: 'Lã sintética' }, sold: 520,
  },
  // ---------------------------------------------------------------- Pisos e Revestimentos
  {
    sku: 'POR-PB-6060', slug: 'porcelanato-polido-60x60-bianco-portobello', name: 'Porcelanato Polido 60×60 Bianco Portobello (cx 1,44 m²)',
    short: 'Retificado, borda reta, para áreas internas.',
    description: 'Porcelanato polido retificado 60×60 cm na cor branca. Caixa com 4 peças (1,44 m²). Use argamassa AC-III e rejunte de 2 mm.',
    category: 'pisos-e-revestimentos', brand: 'Portobello', price: 129.9, promo: 114.9, promoDays: 6,
    unit: 'caixa', unitLabel: 'caixa 1,44 m²', stock: 210, minStock: 30, weight: 32, dims: [62, 62, 6],
    specs: { Formato: '60 × 60 cm', Acabamento: 'Polido', 'm² por caixa': '1,44', Peças: '4', PEI: 'Uso interno' }, featured: true, sold: 860,
  },
  {
    sku: 'PIS-EL-4545', slug: 'piso-ceramico-45x45-acetinado-eliane', name: 'Piso Cerâmico 45×45 Acetinado Eliane (cx 2,43 m²)',
    short: 'PEI 4, para áreas internas de alto tráfego.',
    description: 'Piso cerâmico acetinado 45×45 cm, PEI 4. Caixa com 12 peças (2,43 m²).',
    category: 'pisos-e-revestimentos', brand: 'Eliane', price: 79.9,
    unit: 'caixa', unitLabel: 'caixa 2,43 m²', stock: 180, minStock: 25, weight: 38, dims: [46, 46, 10],
    specs: { Formato: '45 × 45 cm', Acabamento: 'Acetinado', 'm² por caixa': '2,43', PEI: '4' }, sold: 540,
  },
  // ---------------------------------------------------------------- Telhas
  {
    sku: 'TEL-FIB-244', slug: 'telha-fibrocimento-6mm-2-44x1-10-brasilit', name: 'Telha Ondulada Fibrocimento 6 mm 2,44 × 1,10 m Brasilit',
    short: 'Sem amianto, para coberturas residenciais e galpões.',
    description: 'Telha ondulada de fibrocimento sem amianto (CRFS), espessura de 6 mm. Inclinação mínima recomendada de 15%.',
    category: 'telhas', brand: 'Brasilit', price: 79.9,
    unit: 'un', unitLabel: 'unidade', stock: 150, minStock: 20, weight: 22, dims: [244, 110, 6],
    specs: { Dimensões: '2,44 × 1,10 m', Espessura: '6 mm', 'Área útil': '≈ 2,4 m²' }, sold: 610,
  },
  {
    sku: 'TEL-CER-PT', slug: 'telha-ceramica-portuguesa', name: 'Telha Cerâmica Portuguesa Natural',
    short: 'Aproximadamente 16 peças por m².',
    description: 'Telha cerâmica tipo portuguesa na cor natural. Consumo aproximado de 16 peças por m² de telhado. Venda mínima de 100 peças.',
    category: 'telhas', brand: null, price: 2.9,
    unit: 'un', unitLabel: 'unidade', minQty: 100, qtyStep: 50, stock: 9000, minStock: 1000, weight: 2.6, dims: [41, 24, 7],
    specs: { Modelo: 'Portuguesa', Consumo: '≈ 16 un/m²', Cor: 'Natural' }, sold: 21000,
  },
  // ---------------------------------------------------------------- Ferragens
  {
    sku: 'VER-CA50-10', slug: 'vergalhao-ca-50-10mm-12m-gerdau', name: 'Vergalhão CA-50 10 mm (3/8") × 12 m Gerdau',
    short: 'Aço nervurado para estruturas de concreto armado.',
    description: 'Barra de aço CA-50 nervurado de 10 mm e 12 m para vigas, pilares e lajes de concreto armado.',
    category: 'ferragens', brand: 'Gerdau', price: 54.9,
    unit: 'barra', unitLabel: 'barra 12 m', stock: 260, minStock: 40, weight: 7.4, dims: [1200, 1, 1],
    specs: { Bitola: '10 mm (3/8")', Comprimento: '12 m', Categoria: 'CA-50', Norma: 'NBR 7480' }, featured: true, sold: 1750,
  },
  {
    sku: 'ARA-REC-1', slug: 'arame-recozido-18-1kg-gerdau', name: 'Arame Recozido nº 18 Gerdau 1 kg',
    short: 'Para amarração de ferragens.',
    description: 'Arame recozido BWG 18 para amarração de armaduras em obras de concreto armado.',
    category: 'ferragens', brand: 'Gerdau', price: 24.9,
    unit: 'kg', unitLabel: 'rolo 1 kg', stock: 130, minStock: 20, weight: 1, dims: [15, 15, 5],
    specs: { Bitola: 'BWG 18', Peso: '1 kg' }, sold: 900,
  },
  {
    sku: 'PRE-1727-1', slug: 'prego-com-cabeca-17x27-1kg-gerdau', name: 'Prego com Cabeça 17×27 Gerdau 1 kg',
    short: 'Para formas, caixarias e madeiramento.',
    description: 'Prego de aço polido com cabeça, bitola 17×27 (2½" × 11), pacote de 1 kg.',
    category: 'ferragens', brand: 'Gerdau', price: 19.9,
    unit: 'kg', unitLabel: 'pacote 1 kg', stock: 180, minStock: 20, weight: 1, dims: [15, 10, 5],
    specs: { Bitola: '17 × 27', Peso: '1 kg' }, sold: 700,
  },
];

/** Gera um produto completo (formato do banco) a partir do dado bruto */
export function buildProducts(now = Date.now()) {
  return rawProducts.map((p, i) => ({
    id: uid('a0000000', i + 1),
    sku: p.sku,
    slug: p.slug,
    name: p.name,
    short_description: p.short,
    description: p.description,
    category_id: cat(p.category),
    brand_id: brand(p.brand),
    price: p.price,
    promo_price: p.promo ?? null,
    promo_ends_at: p.promo && p.promoDays ? new Date(now + p.promoDays * 86_400_000).toISOString() : null,
    unit: p.unit,
    unit_label: p.unitLabel ?? null,
    min_qty: p.minQty ?? 1,
    qty_step: p.qtyStep ?? 1,
    stock: p.stock,
    min_stock: p.minStock ?? 5,
    weight_kg: p.weight,
    length_cm: p.dims?.[0] ?? null,
    width_cm: p.dims?.[1] ?? null,
    height_cm: p.dims?.[2] ?? null,
    specs: p.specs,
    is_featured: p.featured ?? false,
    is_active: true,
    sold_count: p.sold,
    images: [
      { url: `/images/produtos/${p.slug}-1.svg`, alt: p.name, sort_order: 0 },
      { url: `/images/produtos/${p.slug}-2.svg`, alt: `${p.name} — detalhe`, sort_order: 1 },
    ],
  }));
}

export const deliveryZonesData = [
  {
    id: uid('d0000000', 1), name: 'Erechim (área urbana)', cities: ['Erechim'], state: 'RS',
    base_price: 15, price_per_kg: 0.05, free_above: 500, max_weight_kg: null, delivery_days: 1, active: true, sort_order: 1,
  },
  {
    id: uid('d0000000', 2), name: 'Região — até 30 km',
    cities: ['Paulo Bento', 'Barão de Cotegipe', 'Gaurama', 'Áurea', 'Erebango', 'Getúlio Vargas', 'Três Arroios', 'Quatro Irmãos', 'Ponte Preta', 'Jacutinga'],
    state: 'RS', base_price: 45, price_per_kg: 0.08, free_above: 1500, max_weight_kg: null, delivery_days: 2, active: true, sort_order: 2,
  },
  {
    id: uid('d0000000', 3), name: 'Região — até 60 km',
    cities: ['Estação', 'Aratiba', 'Marcelino Ramos', 'Campinas do Sul', 'Severiano de Almeida', 'Mariano Moro', 'Viadutos', 'Carlos Gomes', 'Centenário', 'Sertão', 'Ipiranga do Sul', 'Floriano Peixoto', 'São Valentim', 'Cruzaltense', 'Itatiba do Sul', 'Benjamin Constant do Sul', 'Faxinalzinho', 'Entre Rios do Sul', 'Erval Grande'],
    state: 'RS', base_price: 85, price_per_kg: 0.12, free_above: 3000, max_weight_kg: 8000, delivery_days: 3, active: true, sort_order: 3,
  },
];

export const couponsData = [
  { code: 'BEMVINDO10', description: '10% na primeira compra (mín. R$ 200)', type: 'percentual', value: 10, min_order_value: 200, max_uses: 500 },
  { code: 'OBRA50', description: 'R$ 50 de desconto em compras acima de R$ 1.000', type: 'valor_fixo', value: 50, min_order_value: 1000, max_uses: null },
  { code: 'FRETEGRATIS', description: 'Frete grátis acima de R$ 300', type: 'frete_gratis', value: 0, min_order_value: 300, max_uses: 200 },
] as const;

export const bannersData = [
  {
    id: uid('e0000000', 1), title: 'Semana da Obra', subtitle: 'Até 15% OFF em cimento, argamassa, tubos e tintas selecionados',
    image_url: null, link_url: '/produtos?ofertas=1', cta_label: 'Ver ofertas', placement: 'ofertas', sort_order: 1, active: true,
  },
];
