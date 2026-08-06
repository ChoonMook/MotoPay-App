/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./**/*.{aspx,master,html,js}",
    "!./obj/**/*",
    "!./bin/**/*"
  ],
  theme: {
    extend: {
      fontFamily: { 
        sans: ['Malgun Gothic', '맑은 고딕', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'] 
      },
      colors: {
        primary: '#3b7ddd', 
        secondary: '#222e3c', 
        tertiary: '#1cbb8c',
        surface: '#f5f7fb', 
        'surface-dim': '#e3e6f0',
        'surface-container-lowest': '#ffffff', 
        'surface-container-low': '#f8f9fa',
        'surface-container': '#e9ecef', 
        'surface-container-high': '#dee2e6',
        'surface-container-highest': '#ced4da',
        'on-surface': '#495057', 
        'on-surface-variant': '#6c757d',
        outline: '#adb5bd', 
        'outline-variant': '#dee2e6',
      }
    },
  },
  plugins: [],
}
