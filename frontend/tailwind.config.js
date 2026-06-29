/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#818cf8',
          DEFAULT: '#4f46e5',
          dark: '#4338ca',
          darker: '#312e81',
        },
        brand: {
          dark: 'rgb(var(--brand-dark) / <alpha-value>)',
          surface: 'rgb(var(--brand-surface) / <alpha-value>)',
          surfaceAlt: 'rgb(var(--brand-surface-alt) / <alpha-value>)',
          indigoDark: 'rgb(var(--brand-indigo-dark) / <alpha-value>)',
        },
      }
    }
  },
  plugins: [],
};

