/**
 * @file Input.tsx
 * @description Reusable input component styled with Tailwind/NativeWind and design system tokens.
 */
import React from 'react';
import { TextInput, TextInputProps, View, Text } from 'react-native';

/**
 * Props for the Input component.
 */
export type InputProps = TextInputProps & {
  className?: string;
  error?: string;
};

/**
 * Reusable input component with error display support.
 */
export function Input({ className = '', error, ...props }: InputProps) {
  return (
    <View className="mb-2 w-full">
      <TextInput
        className={`w-full rounded-lg border bg-white px-4 py-3 text-base ${
          error ? 'border-red-500' : 'border-gray-300'
        } ${className}`}
        placeholderTextColor="#6b7280"
        {...props}
      />
      {error && <Text className="ml-1 mt-1 text-xs text-red-500">{error}</Text>}
    </View>
  );
}
export default Input;
