/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        'rpg-bg': '#1a1410',
        'rpg-surface': '#231e18',
        'rpg-border': 'rgba(180, 150, 100, 0.25)',
        'rpg-gold': '#c4a35a',
        'rpg-cinnabar': '#c24a3a',
        'rpg-exp': '#5a9e6f',
        'rpg-str': '#c24a3a',
        'rpg-int': '#5a7fbf',
        'rpg-vit': '#5a9e6f',
        'rpg-agi': '#c4953a',
        'rpg-wis': '#8a5abf',
        'rpg-mood': '#c94a7a',
        'rpg-ink': '#8a8070',
        'rpg-text': '#d4c8b8',
      },
      fontFamily: {
        'rpg': ['"Space Grotesk"', '"Noto Sans SC"', 'sans-serif'],
        'seal': ['"Share Tech Mono"', '"Noto Sans SC"', 'monospace'],
        'body': ['"Space Grotesk"', '"Noto Sans SC"', 'sans-serif'],
      },
      animation: {
        'exp-fill': 'expFill 0.8s ease-out',
        'bounce-in': 'bounceIn 0.5s ease-out',
        'stamp-press': 'stampPress 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
        'ink-reveal': 'inkReveal 0.6s ease-out',
      },
      keyframes: {
        expFill: {
          '0%': { width: '0%' },
          '100%': { width: 'var(--exp-width)' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '60%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        stampPress: {
          '0%': { transform: 'scale(1)', opacity: '0' },
          '40%': { transform: 'scale(1.15)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        inkReveal: {
          '0%': { opacity: '0', transform: 'translateY(8px)', filter: 'blur(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)', filter: 'blur(0)' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};
