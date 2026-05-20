/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'bsk-bg': '#F8FAFC',
        'bsk-card': '#FFFFFF',
        'bsk-gold': '#F5C518',
        'bsk-gold-dark': '#D97706',
        'bsk-gold-light': '#FEF08A',
        'bsk-blue': '#1E3A8A',
        'bsk-blue-light': '#3B82F6',
        'bsk-text': '#0F172A',
        'bsk-muted': '#475569',
        'bsk-border': '#E2E8F0',
      },
      fontFamily: {
        title: ['Plus Jakarta Sans', 'sans-serif'],
        sans: ['Space Grotesk', 'sans-serif'],
      },
      boxShadow: {
        'glow-blue': '0 0 15px rgba(59, 130, 246, 0.2)',
        'glow-blue-hover': '0 0 25px rgba(59, 130, 246, 0.4)',
        'glow-gold': '0 0 15px rgba(245, 197, 24, 0.3)',
      }
    },
  },
  plugins: [],
}
