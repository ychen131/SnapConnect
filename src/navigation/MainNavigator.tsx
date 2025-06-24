/**
 * @file MainNavigator.tsx
 * @description Placeholder main app navigator for signed-in users.
 */
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/Main/HomeScreen';

/**
 * MainNavigator for signed-in users.
 */
export default function MainNavigator() {
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator>
      <Stack.Screen name="Home" component={HomeScreen} />
    </Stack.Navigator>
  );
}
