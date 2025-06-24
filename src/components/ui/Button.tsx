/**
 * @file Button.tsx
 * @description Reusable button component styled with Tailwind/NativeWind and design system tokens.
 */
import React from 'react';
import { Pressable, Text, PressableProps } from 'react-native';

/**
 * Props for the Button component.
 */
export interface ButtonProps extends PressableProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'accent' | 'text';
}

/**
 * Reusable button component.
 */
export function Button({ label, variant = 'primary', className = '', ...props }: ButtonProps) {
  let base = 'px-md py-sm rounded items-center';
  let color =
    variant === 'primary'
      ? 'bg-brand text-white font-heading'
      : variant === 'accent'
        ? 'bg-accent text-white font-heading'
        : variant === 'text'
          ? 'bg-transparent text-brand font-heading'
          : 'bg-surface border border-brand text-brand font-heading';
  return (
    <Pressable className={`${base} ${color} ${className}`} {...props}>
      <Text className="font-heading text-base">{label}</Text>
    </Pressable>
  );
}
export default Button;
