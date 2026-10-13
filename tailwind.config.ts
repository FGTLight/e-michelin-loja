import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    container: { center: true, padding: { DEFAULT: '1rem', lg: '2rem' }, screens: { '2xl': '1320px' } },
    extend: {
      colors: {
        // Azul petróleo — cor institucional
        petroleo: {
          50: '#eef8fa', 100: '#d4ecf1', 200: '#aedae4', 300: '#78bfcf', 400: '#3f9bb2',
          500: '#257f97', 600: '#1f667f', 700: '#1d5468', 800: '#174456', 900: '#123848', 950: '#0a2530',
        },
        // Laranja de segurança — ações e destaques (usar texto escuro por cima para contraste AA)
        seguranca: {
          50: '#fff6ec', 100: '#ffead3', 200: '#ffd1a5', 300: '#ffb06d', 400: '#ff8a33',
          500: '#ff7210', 600: '#e85a05', 700: '#c04307', 800: '#98360e', 900: '#7b2e0f',
        },
        // Cinza cimento — superfícies e textos secundários
        cimento: {
          50: '#f7f6f4', 100: '#eceae6', 200: '#dcd9d3', 300: '#c3bfb6', 400: '#a29d92',
          500: '#8a857a', 600: '#716c63', 700: '#5c5851', 800: '#4d4a45', 900: '#43403c', 950: '#252321',
        },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(10,37,48,.06), 0 8px 24px -12px rgba(10,37,48,.18)',
        lift: '0 2px 4px rgba(10,37,48,.08), 0 20px 40px -16px rgba(10,37,48,.35)',
      },
      keyframes: {
        marquee: { from: { transform: 'translateX(0)' }, to: { transform: 'translateX(-50%)' } },
        shimmer: { '100%': { transform: 'translateX(100%)' } },
        // Só opacidade: um transform no wrapper da página quebraria o position: fixed do pin do hero (GSAP)
        'page-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        rise: { from: { opacity: '0', transform: 'translateY(24px)' }, to: { opacity: '1', transform: 'none' } },
        'pulse-ring': {
          '0%': { transform: 'scale(.9)', opacity: '.7' },
          '80%,100%': { transform: 'scale(1.6)', opacity: '0' },
        },
      },
      animation: {
        marquee: 'marquee 40s linear infinite',
        shimmer: 'shimmer 1.4s infinite',
        // fill-mode backwards: ao terminar, nenhum efeito da animação fica ativo no wrapper
        'page-in': 'page-in .25s ease-out backwards',
        rise: 'rise .7s cubic-bezier(.22,1,.36,1) both',
        'pulse-ring': 'pulse-ring 2.2s cubic-bezier(.2,.6,.4,1) infinite',
      },
    },
  },
  plugins: [],
};

export default config;
