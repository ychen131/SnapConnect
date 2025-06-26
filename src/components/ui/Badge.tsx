/**
 * @file Badge.tsx
 * @description Simple badge component for showing notification indicators.
 */
import React from 'react';
import { View, ViewProps } from 'react-native';

/**
 * Props for the Badge component.
 */
export interface BadgeProps extends ViewProps {
  visible?: boolean;
  size?: number;
  color?: string;
  className?: string;
}

/**
 * Simple badge component for notification indicators.
 */
export function Badge({
  visible = true,
  size = 8,
  color = '#EF4444', // red-500
  className = '',
  style,
  ...props
}: BadgeProps) {
  if (!visible) return null;

  return (
    <View
      className={`absolute -right-1 -top-1 rounded-full ${className}`}
      style={[
        {
          width: size,
          height: size,
          backgroundColor: color,
        },
        style,
      ]}
      {...props}
    />
  );
}

export default Badge;
