/**
 * Gera ilustrações SVG leves para os produtos de exemplo.
 * Em produção, substitua por fotos reais enviadas pelo painel (Supabase Storage).
 * Uso: npm run images:generate   (Node >= 22.18 executa TypeScript nativamente)
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { categoriesData, rawProducts } from '../src/data/catalog.ts';

const OUT = join(import.meta.dirname, '..', 'public', 'images', 'produtos');
mkdirSync(OUT, { recursive: true });

const palette: Record<string, [string, string, string]> = {
  'cimento-e-argamassa': ['#eceae6', '#c3bfb6', '#5c5851'],
  hidraulica: ['#d4ecf1', '#78bfcf', '#1d5468'],
  eletrica: ['#fff6ec', '#ffd1a5', '#c04307'],
  ferramentas: ['#eceae6', '#ffb06d', '#123848'],
  tintas: ['#eef8fa', '#aedae4', '#1f667f'],
  'pisos-e-revestimentos': ['#f7f6f4', '#dcd9d3', '#716c63'],
  telhas: ['#fff6ec', '#ff8a33', '#98360e'],
  ferragens: ['#eceae6', '#a29d92', '#252321'],
};

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function wrap(text: string, max = 24, lines = 3) {
  const out: string[] = [];
  let cur = '';
  for (const w of text.split(' ')) {
    if ((cur + ' ' + w).trim().length > max) {
      out.push(cur.trim());
      cur = w;
    } else cur += ' ' + w;
  }
  if (cur.trim()) out.push(cur.trim());
  if (out.length > lines) {
    out.length = lines;
    out[lines - 1] += '…';
  }
  return out;
}

const range = (n: number) => Array.from({ length: n }, (_, i) => i);

const icons: Record<string, (c: string, a: string) => string> = {
  'cimento-e-argamassa': (c, a) => `
    <path d="M280 170h240l30 300H250z" fill="${c}"/><path d="M280 170h240l8 60H272z" fill="${a}"/>
    <rect x="300" y="300" width="200" height="90" rx="10" fill="#fff" opacity=".9"/>
    <path d="M330 345h140M330 365h90" stroke="${c}" stroke-width="12" stroke-linecap="round"/>`,
  hidraulica: (c, a) => `
    <rect x="200" y="300" width="260" height="56" rx="8" fill="${c}"/><rect x="430" y="170" width="56" height="186" rx="8" fill="${c}"/>
    <rect x="186" y="292" width="34" height="72" rx="6" fill="${a}"/><rect x="422" y="156" width="72" height="34" rx="6" fill="${a}"/>
    <circle cx="580" cy="330" r="62" fill="none" stroke="${a}" stroke-width="18"/><path d="M580 268v124M518 330h124" stroke="${a}" stroke-width="14"/>
    <path d="M300 420c0 30 40 30 40 0s-20-40-20-40-20 10-20 40z" fill="${a}"/>`,
  eletrica: (c, a) => `
    <circle cx="340" cy="320" r="130" fill="none" stroke="${c}" stroke-width="34"/><circle cx="340" cy="320" r="70" fill="none" stroke="${a}" stroke-width="22"/>
    <path d="M540 170 470 330h60l-40 150 120-190h-66l50-120z" fill="${a}" stroke="${c}" stroke-width="10" stroke-linejoin="round"/>`,
  ferramentas: (c, a) => `
    <g transform="rotate(-35 400 320)"><rect x="380" y="190" width="40" height="280" rx="12" fill="${a}"/><rect x="300" y="160" width="200" height="70" rx="14" fill="${c}"/></g>
    <g transform="rotate(35 400 320)"><rect x="384" y="210" width="32" height="250" rx="10" fill="${c}"/><circle cx="400" cy="200" r="48" fill="${c}"/><circle cx="400" cy="200" r="22" fill="${a}"/></g>`,
  tintas: (c, a) => `
    <rect x="270" y="210" width="260" height="250" rx="18" fill="${c}"/><ellipse cx="400" cy="210" rx="130" ry="30" fill="${a}"/>
    <path d="M300 210c0 60 30 60 30 0zM380 210c0 90 34 90 34 0zM460 210c0 50 26 50 26 0z" fill="${a}"/>
    <rect x="300" y="300" width="200" height="90" rx="10" fill="#fff" opacity=".9"/><path d="M270 230q130-130 260 0" fill="none" stroke="${c}" stroke-width="10"/>`,
  'pisos-e-revestimentos': (c, a) =>
    `<g transform="translate(400 320) skewX(-20) scale(1 .62)">` +
    range(3).map((r) => range(3).map((k) =>
      `<rect x="${-210 + k * 140}" y="${-210 + r * 140}" width="132" height="132" rx="4" fill="${(r + k) % 2 ? a : c}"/>`).join('')).join('') +
    `</g>`,
  telhas: (c, a) =>
    `<path d="M190 330 400 170l210 160z" fill="${a}"/>` +
    range(4).map((r) => `<path d="M232 ${336 + r * 36}${range(6).map(() => 'q28 -30 56 0').join('')}" fill="none" stroke="${c}" stroke-width="22" stroke-linecap="round"/>`).join(''),
  ferragens: (c, a) =>
    range(5).map((k) =>
      `<g transform="rotate(${-20 + k * 4} 400 320)"><rect x="200" y="${240 + k * 34}" width="400" height="18" rx="9" fill="${k % 2 ? a : c}"/>` +
      range(8).map((j) => `<rect x="${215 + j * 48}" y="${236 + k * 34}" width="8" height="26" fill="${c}" opacity=".5"/>`).join('') +
      `</g>`).join(''),
};

const unitLabel: Record<string, string> = {
  un: 'unidade', m: 'metro', m2: 'm²', m3: 'm³', saco: 'saco', caixa: 'caixa', barra: 'barra',
  lata: 'lata', rolo: 'rolo', kg: 'kg', milheiro: 'milheiro',
};

// O otimizador do Next 14 só reconhece SVG com o prólogo XML
const head = '<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 800" font-family="Arial,Helvetica,sans-serif">';

for (const p of rawProducts) {
  const [bg, accent, ink] = palette[p.category];
  const catName = categoriesData.find((c) => c.slug === p.category)!.name;
  const lines = wrap(p.name);

  const main = `${head}
    <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${bg}"/><stop offset="1" stop-color="#ffffff"/></linearGradient></defs>
    <rect width="800" height="800" fill="url(#g)"/><circle cx="660" cy="120" r="180" fill="${accent}" opacity=".25"/>
    <rect x="40" y="40" width="${catName.length * 13 + 44}" height="44" rx="22" fill="${ink}"/>
    <text x="62" y="70" font-size="22" font-weight="700" fill="#fff">${esc(catName)}</text>
    ${icons[p.category](ink, accent)}
    ${lines.map((l, i) => `<text x="400" y="${560 + i * 50}" font-size="40" font-weight="800" text-anchor="middle" fill="#0a2530">${esc(l)}</text>`).join('')}
    <text x="400" y="740" font-size="24" text-anchor="middle" fill="#5c5851">${esc(p.brand ?? 'E Michelin e Cia')} · ${esc(p.unitLabel ?? unitLabel[p.unit])}</text>
  </svg>`;

  const specs = Object.entries(p.specs).slice(0, 5);
  const detail = `${head}
    <rect width="800" height="800" fill="${ink}"/>
    <g opacity=".18" transform="translate(120 -60) scale(1.1)">${icons[p.category]('#ffffff', accent)}</g>
    <text x="60" y="110" font-size="30" font-weight="800" fill="${accent}">FICHA TÉCNICA</text>
    <text x="60" y="160" font-size="26" fill="#fff">SKU ${esc(p.sku)}</text>
    ${specs.map(([k, v], i) => `<rect x="60" y="${230 + i * 92}" width="680" height="76" rx="14" fill="#ffffff" opacity=".08"/>
      <text x="90" y="${278 + i * 92}" font-size="26" fill="#d4ecf1">${esc(k)}</text>
      <text x="710" y="${278 + i * 92}" font-size="28" font-weight="700" text-anchor="end" fill="#fff">${esc(v)}</text>`).join('')}
  </svg>`;

  writeFileSync(join(OUT, `${p.slug}-1.svg`), main.replace(/\n\s*/g, ''));
  writeFileSync(join(OUT, `${p.slug}-2.svg`), detail.replace(/\n\s*/g, ''));
}

console.log(`✔ ${rawProducts.length * 2} imagens geradas em public/images/produtos`);
