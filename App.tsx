/**
 * @file App.tsx
 * @description Main App component with navigation setup and theme demo.
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation/RootNavigator';
import { View } from 'react-native';
import 'nativewind/types';

export default function App() {
  return (
    <View className="flex-1 bg-gray-100">
      <StatusBar style="dark" />
      <RootNavigator />
    </View>
  );
}
