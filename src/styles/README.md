# /src/styles

This directory contains global styling configuration for SnapConnect.

## Theme Usage

- Colors and fonts are defined in `tailwind.config.js` at the project root.
- Use NativeWind utility classes in your React Native components:
  - Example: `<View className="bg-primary flex-1 justify-center items-center">`
  - Example: `<Text className="text-black font-display text-2xl">Hello</Text>`

## Adding Custom Styles

- Extend the theme in `tailwind.config.js` for new colors, fonts, or spacing.
- For global styles, create utility files here and import them where needed.

## Resources

- [NativeWind Docs](https://www.nativewind.dev/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs/theme)
