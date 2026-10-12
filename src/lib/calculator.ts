/**
 * Calculadora de materiais — coeficientes médios de mercado, já com perdas.
 * São estimativas: o resultado deve ser conferido por um profissional responsável pela obra.
 */

export type CalcMode = 'parede' | 'contrapiso' | 'piso' | 'pintura';

export interface CalcLine {
  sku: string;
  quantity: number;
  reason: string;
}

export interface CalcResult {
  lines: CalcLine[];
  notes: string[];
}

export const CALC_SKUS = {
  blocoCeramico: 'BLO-CER-9',
  blocoConcreto: 'BLO-CON-14',
  argamassaAssentamento: 'ARG-ASSENT-20',
  cimento: 'CIM-CPII-50',
  cal: 'CAL-CHIII-20',
  areia: 'ARE-MED-M3',
  porcelanato: 'POR-PB-6060',
  piso: 'PIS-EL-4545',
  argamassaAC3: 'ARG-ACIII-20',
  argamassaAC1: 'ARG-ACI-20',
  rejunte: 'REJ-FLEX-1',
  tinta18: 'TIN-COR-18',
  tinta36: 'TIN-COR-36',
  rolo: 'ROL-LA-23',
  massa: 'MAS-COR-25',
} as const;

const ceilTo = (v: number, step: number) => Math.ceil(v / step - 1e-9) * step;
const fmt = (v: number, d = 2) => v.toLocaleString('pt-BR', { maximumFractionDigits: d });

export interface ParedeInput { area: number; bloco: 'ceramico' | 'concreto'; reboco: boolean }
export function calcParede({ area, bloco, reboco }: ParedeInput): CalcResult {
  const perM2 = bloco === 'ceramico' ? 25 : 12.5;
  const blocos = ceilTo(area * perM2 * 1.05, bloco === 'ceramico' ? 50 : 10);
  const argKg = area * (bloco === 'ceramico' ? 10 : 15) * 1.05;
  const lines: CalcLine[] = [
    { sku: bloco === 'ceramico' ? CALC_SKUS.blocoCeramico : CALC_SKUS.blocoConcreto, quantity: Math.max(blocos, bloco === 'ceramico' ? 100 : 50), reason: `${perM2} un/m² + 5% de perda` },
    { sku: CALC_SKUS.argamassaAssentamento, quantity: Math.ceil(argKg / 20), reason: `≈ ${fmt(argKg, 0)} kg de argamassa de assentamento` },
  ];
  if (reboco) {
    const faces = area * 2;
    lines.push(
      { sku: CALC_SKUS.cimento, quantity: Math.ceil((faces * 3) / 50), reason: `Reboco 2 cm nos dois lados (${fmt(faces)} m²)` },
      { sku: CALC_SKUS.cal, quantity: Math.ceil((faces * 2.5) / 20), reason: 'Traço 1:2:8 (cimento, cal e areia)' },
      { sku: CALC_SKUS.areia, quantity: Math.max(0.5, ceilTo(faces * 0.024, 0.5)), reason: `≈ ${fmt(faces * 0.024)} m³ de areia` },
    );
  }
  return { lines, notes: ['Descontar portas e janelas da área informada.', 'Consumo considera juntas de 1 cm.'] };
}

export interface ContrapisoInput { area: number; espessuraCm: number }
export function calcContrapiso({ area, espessuraCm }: ContrapisoInput): CalcResult {
  const vol = area * (espessuraCm / 100) * 1.1;
  return {
    lines: [
      { sku: CALC_SKUS.cimento, quantity: Math.ceil((vol * 400) / 50), reason: `Traço 1:3 · ${fmt(vol)} m³ de argamassa` },
      { sku: CALC_SKUS.areia, quantity: Math.max(0.5, ceilTo(vol * 1.15, 0.5)), reason: 'Areia média lavada' },
    ],
    notes: ['Espessura mínima recomendada: 3 cm (aderido) ou 5 cm (flutuante).', 'Inclui 10% de perda.'],
  };
}

export interface PisoInput { area: number; tipo: 'porcelanato' | 'ceramico'; m2PorCaixa: number }
export function calcPiso({ area, tipo, m2PorCaixa }: PisoInput): CalcResult {
  const comPerda = area * 1.1;
  const kgArg = area * (tipo === 'porcelanato' ? 5 : 4.5);
  return {
    lines: [
      { sku: tipo === 'porcelanato' ? CALC_SKUS.porcelanato : CALC_SKUS.piso, quantity: Math.ceil(comPerda / m2PorCaixa), reason: `${fmt(comPerda)} m² com 10% de perda (${fmt(m2PorCaixa)} m²/caixa)` },
      { sku: tipo === 'porcelanato' ? CALC_SKUS.argamassaAC3 : CALC_SKUS.argamassaAC1, quantity: Math.ceil(kgArg / 20), reason: `≈ ${fmt(kgArg, 0)} kg${tipo === 'porcelanato' ? ' (dupla colagem)' : ''}` },
      { sku: CALC_SKUS.rejunte, quantity: Math.max(1, Math.ceil(area * 0.3)), reason: '≈ 0,3 kg/m² (junta de 2 a 3 mm)' },
    ],
    notes: ['Para recortes e paginação diagonal, considere 15% de perda.'],
  };
}

export interface PinturaInput { area: number; demaos: number; massa: boolean; precoLata18: number; precoGalao: number }
export function calcPintura({ area, demaos, massa, precoLata18, precoGalao }: PinturaInput): CalcResult {
  // Rendimento prático conservador: 10 m²/L por demão (superfícies seladas e lisas rendem mais)
  const litros = (area * demaos) / 10;
  let latas = Math.floor(litros / 18);
  let galoes = Math.ceil((litros - latas * 18) / 3.6 - 1e-9);
  if (galoes * precoGalao >= precoLata18) { latas += 1; galoes = 0; }
  const lines: CalcLine[] = [];
  if (latas) lines.push({ sku: CALC_SKUS.tinta18, quantity: latas, reason: `${fmt(litros, 1)} L para ${demaos} demãos` });
  if (galoes) lines.push({ sku: CALC_SKUS.tinta36, quantity: galoes, reason: 'Complemento em galões de 3,6 L' });
  lines.push({ sku: CALC_SKUS.rolo, quantity: Math.max(1, Math.ceil(area / 150)), reason: '1 rolo a cada ~150 m²' });
  if (massa) lines.push({ sku: CALC_SKUS.massa, quantity: Math.ceil((area * 0.5) / 25), reason: '≈ 0,5 kg/m² por demão de massa' });
  return { lines, notes: ['Rendimento considerado: 10 m² por litro por demão.', 'Superfícies novas pedem selador antes da tinta.'] };
}
