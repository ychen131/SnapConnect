/**
 * @file Input.tsx
 * @description Reusable input component styled with Tailwind/NativeWind and design system tokens.
 */
import React from 'react';
import { TextInput, TextInputProps } from 'react-native';

/**
 * Props for the Input component.
 */
export type InputProps = TextInputProps & {
  className?: string;
};

/**
 * Reusable input component.
 */
export function Input({ className = '', ...props }: InputProps) {
  return (
    <TextInput
      className={`border-brand px-md py-sm w-full rounded border bg-white text-base ${className}`}
      placeholderTextColor="#6b7280"
      {...props}
    />
  );
}
export default Input;
