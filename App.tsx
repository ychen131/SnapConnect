/**
 * @file App.tsx
 * @description Main App component with navigation setup and theme demo.
 */

import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './src/navigation/RootNavigator';
import { View, Text } from 'react-native';
import { StyleSheet } from 'nativewind';
import { TestComponent } from './src/components/TestComponent';

// import './src/styles/global.css';
// import 'nativewind/types'

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-primary">
      <Text className="text-3xl font-bold text-black">NativeWind Works!</Text>
    </View>
  );
}
