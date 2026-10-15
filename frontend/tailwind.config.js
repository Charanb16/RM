/** @type {import('tailwindcss').Config} */
const config = {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#060A14',
          900: '#0A0F1E',
          850: '#0D1428',
          800: '#111A33',
          700: '#1B274B',
          600: '#263768',
        },
        brand: {
          dark: '#0A0F1E',
          surface: '#111827',
          card: 'rgba(17, 24, 39, 0.75)',
          amber: '#F59E0B',
          orange: '#F97316',
          red: '#EF4444',
          blue: '#3B82F6',
          green: '#10B981',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      keyframes: {
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%': { opacity: '0', transform: 'translateX(24px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseDot: {
          '0%, 100%': { transform: 'scale(1)', opacity: '1' },
          '50%': { transform: 'scale(1.4)', opacity: '0.6' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 15px rgba(245, 158, 11, 0.5)' },
          '50%': { boxShadow: '0 0 25px rgba(245, 158, 11, 0.8)' },
        },
      },
      animation: {
        fadeInUp: 'fadeInUp 0.4s ease-out forwards',
        slideInRight: 'slideInRight 0.35s ease-out forwards',
        pulseDot: 'pulseDot 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        glow: 'glow 2s ease-in-out infinite',
      },
      backgroundImage: {
        'cta-gradient': 'linear-gradient(135deg, #F59E0B 0%, #EF4444 100%)',
        'cta-gradient-hover': 'linear-gradient(135deg, #D97706 0%, #DC2626 100%)',
        'blue-gradient': 'linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)',
        'radial-glow': 'radial-gradient(circle at 50% 0%, rgba(59, 130, 246, 0.15) 0%, transparent 70%)',
      },
    },
  },
  plugins: [],
};

export default config;
