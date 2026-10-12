import { ImageResponse } from 'next/og';
import { site } from '@/config/site';

export const runtime = 'edge';
export const alt = site.title;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OgImage() {
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#0a2530', color: 'white', padding: 64, fontFamily: 'sans-serif' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ width: 72, height: 72, background: '#ff7210', borderRadius: 16 }} />
          <div style={{ fontSize: 40, fontWeight: 800 }}>E Michelin e Cia</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05 }}>Material de construção</div>
          <div style={{ fontSize: 76, fontWeight: 800, lineHeight: 1.05, color: '#ff8a33' }}>em Erechim</div>
          <div style={{ fontSize: 30, marginTop: 24, color: '#d4ecf1' }}>Hidráulica · Elétrica · Ferramentas · Tintas · Entrega rápida na região</div>
        </div>
        <div style={{ height: 16, width: '100%', background: '#ff7210', borderRadius: 8 }} />
      </div>
    ),
    size,
  );
}
