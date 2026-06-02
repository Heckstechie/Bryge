/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cream:  '#EDE8DF',
        navy:   '#1B2F5C',
        'navy-700': '#162549',
        'navy-100': '#E8ECF5',
        sand:   '#D4CFC7',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
