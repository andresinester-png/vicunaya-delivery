/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ── Marca: rojo cálido (vermellón) ──
        primary: {
          DEFAULT: '#E63A2E',
          dark:    '#C42B22',
          light:   '#F2563F',
          bg:      '#FDEEEC',
        },
        // ── Acento: amarillo maíz ──
        accent: {
          DEFAULT: '#F2A516',
          dark:    '#D98C0A',
          bg:      '#FEF6E6',
        },
        // ── Tinta cálida (texto / nav) ──
        ink: {
          DEFAULT: '#1F1815',
          soft:    '#574E48',
          muted:   '#938A82',
        },
        // ── Superficies ──
        surface: '#FBF6EF', // fondo de app (crema)
        line:    '#ECE4DA', // bordes/divisores cálidos
        // ── Funcional ──
        success: '#1F9D55',
      },
      fontFamily: {
        sans:    ['Plus Jakarta Sans', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['Bricolage Grotesque', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        // sombras con tinte cálido marrón en vez de negro puro
        card:         '0 4px 20px rgba(60,34,22,0.08)',
        'card-hover': '0 10px 32px rgba(60,34,22,0.16)',
        nav:          '0 -4px 24px rgba(60,34,22,0.08)',
        cta:          '0 6px 18px rgba(230,58,46,0.32)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.25rem',
        '4xl': '1.5rem',
      },
      keyframes: {
        shimmer: {
          '0%':   { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        'slide-up': {
          '0%':   { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)',     opacity: '1' },
        },
      },
      animation: {
        shimmer:    'shimmer 1.4s ease-in-out infinite',
        'slide-up': 'slide-up 0.35s ease-out',
      },
    },
  },
  plugins: [],
};
