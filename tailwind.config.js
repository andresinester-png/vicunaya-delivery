/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0D9488',
          dark:    '#0F766E',
          light:   '#14B8A6',
          bg:      '#F0FDFA',
        },
        navy: '#0F172A',
        surface: '#ffffff',
        'border-card': '#e2e8f0',
        'text-main':   '#0b1c30',
        'text-secondary': '#64748b',
        'text-muted':  '#94a3b8',
        'open-green':  '#2E7D32',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Segoe UI', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card:         '0 4px 14px rgba(0,0,0,0.06)',
        'card-hover': '0 8px 32px rgba(0,0,0,0.14)',
        nav:          '0 2px 12px rgba(0,0,0,0.06)',
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
