/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream:       '#EDE8DF',
        navy:        '#1B2F5C',
        'navy-700':  '#162549',
        'navy-100':  '#E8ECF5',
        sand:        '#D4CFC7',
        rust:        '#953F10',
        'rust-dark': '#7A3409',
        sage:        '#6B8F74',
        'warm-brown':'#7D5A3E',
        'dark-navy': '#162C4A',
        'hiw-bg':    '#2D1A0E',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
