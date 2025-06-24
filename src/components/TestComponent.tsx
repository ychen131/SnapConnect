/**
 * @file TestComponent.tsx
 * @description Test component to verify NativeWind integration.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

/**
 * Test component to verify NativeWind/Tailwind integration
 * @returns JSX element with various Tailwind classes
 */
export function TestComponent() {
  return (
    <View className="flex-1 bg-gray-100 p-4">
      <View className="bg-white rounded-lg p-6 shadow-lg">
        <Text className="text-2xl font-bold text-gray-800 mb-4">NativeWind Test</Text>

        <View className="space-y-4">
          <View className="bg-primary p-3 rounded">
            <Text className="text-black font-semibold text-center">
              Primary Color (Snapchat Yellow)
            </Text>
          </View>

          <View className="bg-accent p-3 rounded">
            <Text className="text-white font-semibold text-center">Accent Color (Red)</Text>
          </View>

          <View className="bg-gray-800 p-3 rounded">
            <Text className="text-white font-semibold text-center">Dark Gray</Text>
          </View>
        </View>

        <TouchableOpacity className="bg-blue-500 mt-6 p-3 rounded-lg">
          <Text className="text-white font-semibold text-center">Test Button</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
