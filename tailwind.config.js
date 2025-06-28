/** * @type {import('tailwindcss').Config}
 * @description This config file has been updated to reflect the new SnapDog brand identity.
 * It uses a light theme with a peachy/coral brand color and the "Nunito" font family.
 */
module.exports = {
  content: ['./App.{js,jsx,ts,tsx}', './src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#FF8C69', // Primary brand color: Peachy-Coral
          light: '#FFF0E6', // Lighter shade, used for secondary buttons
          dark: '#E07B5C', // A darker shade for hover/pressed states
        },
        accent: '#D05A5A', // The red text color from the design
        background: '#FFFFFF', // Pure white background
        surface: '#FFFFFF', // Card backgrounds
        muted: '#AAB0B7', // Muted text color for secondary info
        error: '#ef4444', // red-500
        success: '#22c55e', // green-500
        // Dark mode overrides (can be refined later if dark mode is implemented)
        'background-dark': '#18181b',
        'surface-dark': '#27272a',
        'muted-dark': '#a1a1aa',
      },
      spacing: {
        xs: '4px',
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
      },
      fontFamily: {
        // IMPORTANT: You must install the "Nunito" font family in your project for this to work.
        sans: ['Nunito', 'ui-sans-serif', 'system-ui'],
        heading: ['Nunito', 'ui-sans-serif', 'system-ui'], // Using the same family for a cohesive look
      },
      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['14px', { lineHeight: '20px' }],
        base: ['16px', { lineHeight: '24px' }],
        lg: ['20px', { lineHeight: '28px' }],
        xl: ['24px', { lineHeight: '32px' }],
        '2xl': ['30px', { lineHeight: '36px' }],
      },
    },
  },
  plugins: [],
};
