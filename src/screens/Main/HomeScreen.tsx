/**
 * @file HomeScreen.tsx
 * @description Placeholder home screen for main app flow.
 */
import React from 'react';
import { View, Text } from 'react-native';

/**
 * Displays a placeholder home screen for signed-in users.
 */
export default function HomeScreen() {
  return (
    <View className="flex-1 items-center justify-center bg-gray-50">
      <Text className="text-text-primary font-heading text-xl font-bold">
        Main App Home (Placeholder)
      </Text>
    </View>
  );
}
