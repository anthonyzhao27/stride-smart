// tailwind.config.js
import lineClamp from '@tailwindcss/line-clamp';

module.exports = {
  darkMode: 'class', // ✅ Good — this enables manual dark mode toggling
  content: [
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
        animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        },
        keyframes: {
            fadeIn: {
            from: { opacity: 0, transform: 'scale(0.98)' },
            to: { opacity: 1, transform: 'scale(1)' },
            },
        },
    },
  },
  plugins: [lineClamp],
};
