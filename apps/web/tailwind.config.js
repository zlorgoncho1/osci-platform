/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Space Grotesk', 'sans-serif'],
        brand: ['Stack Sans Notch', 'Space Grotesk', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        'osci-bg': '#020202',
        'osci-card': '#09090B',
        'osci-border': 'rgba(255, 255, 255, 0.06)',
      },
    },
  },
  plugins: [],
};
