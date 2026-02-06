/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Definimos el rojo característico de EZEHCUT
        ezehred: {
          600: '#dc2626',
          700: '#b91c1c',
        }
      }
    },
  },
  plugins: [],
}
