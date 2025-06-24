/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        background: '#111111',
        'ui-primary': '#1C1C1E',
        'ui-secondary': '#2C2C2E',
        'text-primary': '#FFFFFF',
        'text-secondary': '#8E8E93',
        accent: '#007AFF',
        error: '#FF3B30',
        success: '#34C759',
      },
      fontSize: {
        '3xl': ['30px', { lineHeight: '36px', fontWeight: '700' }],
        xl: ['20px', { lineHeight: '28px', fontWeight: '700' }],
        base: ['17px', { lineHeight: '24px', fontWeight: '400' }],
        sm: ['15px', { lineHeight: '20px', fontWeight: '400' }],
        xs: ['13px', { lineHeight: '16px', fontWeight: '400' }],
      },
      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        6: '24px',
        8: '32px',
      },
      borderRadius: {
        lg: '8px',
        '2xl': '16px',
      },
    },
  },
  plugins: [],
};
