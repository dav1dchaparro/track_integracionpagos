/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        neon: {
          DEFAULT: '#00e676',
          dim: '#00c853',
        },
        sidebar: '#080f0a',
        'scifi-bg': '#060d08',
        'scifi-card': '#0d1f12',
      },
      animation: {
        'fade-in-up':    'fadeInUp 0.35s ease-out forwards',
        'fade-in':       'fadeIn 0.2s ease-out forwards',
        'slide-in-right':'slideInRight 0.28s ease-out forwards',
        'scale-in':      'scaleIn 0.2s ease-out forwards',
        'shimmer':       'shimmer 1.5s infinite',
        'pulse-neon':    'pulseNeon 2s ease-in-out infinite',
      },
      keyframes: {
        fadeInUp: {
          '0%':   { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideInRight: {
          '0%':   { opacity: '0', transform: 'translateX(12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseNeon: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(0,230,118,0.4)' },
          '50%':      { boxShadow: '0 0 24px rgba(0,230,118,0.7)' },
        },
      },
      boxShadow: {
        'neon-sm': '0 0 8px 0 rgba(0,230,118,0.3)',
        'neon-md': '0 0 20px 0 rgba(0,230,118,0.25)',
        'neon-lg': '0 0 40px 0 rgba(0,230,118,0.2)',
        'green-sm': '0 1px 3px 0 rgb(22 163 74 / 0.15)',
        'green-md': '0 4px 16px 0 rgb(22 163 74 / 0.2)',
        'green-lg': '0 8px 32px 0 rgb(22 163 74 / 0.25)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
}
