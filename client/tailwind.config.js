/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#0b0d12',
          900: '#12151c',
          800: '#1b1f29',
          700: '#262b38',
          600: '#343b4a',
          500: '#4a5266',
        },
        accent: {
          400: '#7c9cff',
          500: '#5b7cfa',
          600: '#4560e0',
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
