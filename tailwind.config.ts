import type { Config } from 'tailwindcss';

// Design tokens for Foleni.
//
// Deliberately not a default Tailwind/shadcn palette. The brand is rooted
// in the physical object this app replaces: a paper queue ticket handed
// over a counter. Warm paper background instead of dark-mode-by-default,
// an ink color instead of pure black, and a single confident accent
// (terracotta) instead of a blue/purple SaaS gradient.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#F7F3EC', // warm off-white, not clinical white
          dim: '#EFE9DD',
          card: '#FFFDF9',
        },
        ink: {
          DEFAULT: '#1C1A17', // near-black with a warm cast, not #000
          soft: '#57524A',
          faint: '#8B857A',
        },
        terracotta: {
          DEFAULT: '#C1502E',
          dark: '#9A3E23',
          light: '#E8B6A2',
          wash: '#FBEAE3',
        },
        teal: {
          DEFAULT: '#2B6E6A',
          dark: '#1E4F4C',
          wash: '#E3EFEE',
        },
        line: 'rgba(28, 26, 23, 0.12)',
      },
      fontFamily: {
        // Fraunces: a warm, slightly irregular serif with real personality,
        // used only for display text (headlines, ticket numbers). It is
        // what stops this from reading as a generic dashboard template.
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        // Plex is used for everything functional: labels, body copy, UI.
        sans: ['var(--font-plex)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-plex-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        sm: '3px',
        DEFAULT: '5px',
        md: '7px',
        lg: '10px',
      },
      boxShadow: {
        ticket: '0 1px 0 rgba(28,26,23,0.04), 0 8px 24px -12px rgba(28,26,23,0.18)',
        card: '0 1px 2px rgba(28,26,23,0.04), 0 4px 16px -8px rgba(28,26,23,0.12)',
      },
      letterSpacing: {
        tightish: '-0.01em',
        widetrack: '0.08em',
      },
    },
  },
  plugins: [],
};

export default config;
