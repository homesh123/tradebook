/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'apple-blue': '#007AFF',
        'apple-green': '#34C759',
        'apple-red': '#FF3B30',
        'apple-yellow': '#FFCC00',
        'apple-orange': '#FF9500',
        'apple-purple': '#AF52DE',
        'apple-gray': {
          50: '#F9F9F9',
          100: '#F5F5F7',
          200: '#E8E8ED',
          300: '#D2D2D7',
          400: '#86868B',
          500: '#6E6E73',
          600: '#424245',
          700: '#333336',
          800: '#1D1D1F',
          900: '#000000',
        },
      },
      borderRadius: { apple: '12px' },
      boxShadow: {
        apple: '0 1px 3px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.03)',
        'apple-lg': '0 4px 6px rgba(0,0,0,0.02), 0 2px 4px rgba(0,0,0,0.03)',
      },
    },
  },
  plugins: [],
};
