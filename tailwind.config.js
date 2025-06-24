/**
 * @file tailwind.config.js
 * @description Tailwind CSS configuration for NativeWind (SnapConnect theme).
 */

module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#FFFC00', // Snapchat yellow
        black: '#000000',
        white: '#FFFFFF',
        gray: {
          100: '#F5F5F5',
          200: '#E5E5E5',
          300: '#D4D4D4',
          400: '#A3A3A3',
          500: '#737373',
          600: '#525252',
          700: '#404040',
          800: '#262626',
          900: '#171717',
        },
        accent: '#FF3B30', // Red accent for errors/alerts
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        display: ['"Bebas Neue"', 'cursive'],
      },
    },
  },
  plugins: [],
};
