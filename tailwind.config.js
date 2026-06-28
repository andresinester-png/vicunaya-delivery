/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // ── Único color de marca: rojo cálido (vermellón) ──
        // Usar SOLO para CTAs, estados activos y acentos de marca.
        primary: {
          DEFAULT: '#e31b23', // mismo rojo del header de marca
          dark:    '#c01920',
          light:   '#ef4b52',
          bg:      '#FEF2F2',
        },
        // ── Neutrales (texto / superficies / bordes) ──
        ink: {
          DEFAULT: '#1C1C1E', // casi negro, no negro puro
          soft:    '#56565A',
          muted:   '#8A8A8E',
        },
        surface: '#F5F5F6', // fondo de app (gris muy claro)
        line:    '#E6E6E8', // bordes/divisores
        // ── Funcionales (uso restringido, no son colores de marca) ──
        accent:  '#E0A516', // estrellas de rating únicamente
        success: '#1F9D55', // badge abierto/cerrado únicamente
      },
      fontFamily: {
        sans:    ['Plus Jakarta Sans', 'Segoe UI', 'system-ui', 'sans-serif'],
        display: ['Bricolage Grotesque', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        // sombras neutras y sutiles
        card:         '0 1px 3px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.10)',
        nav:          '0 -1px 12px rgba(0,0,0,0.05)',
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
