/**
 * @file Card.tsx
 * @description Reusable card component styled with Tailwind/NativeWind and design system tokens.
 */
import React from 'react';
import { View, ViewProps } from 'react-native';

/**
 * Props for the Card component.
 */
export type CardProps = ViewProps & {
  className?: string;
  children: React.ReactNode;
};

/**
 * Reusable card component.
 */
export function Card({ className = '', children, ...props }: CardProps) {
  return (
    <View className={`bg-surface p-lg rounded-xl shadow ${className}`} {...props}>
      {children}
    </View>
  );
}
export default Card;
