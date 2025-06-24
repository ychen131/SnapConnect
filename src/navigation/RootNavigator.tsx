/**
 * @file RootNavigator.tsx
 * @description Root navigator that switches between authentication and main app flows.
 */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from '../screens/Auth/LoginScreen';
import MainNavigator from './MainNavigator';

/**
 * RootNavigator switches between Auth and Main flows.
 * Replace isSignedIn with real auth logic later.
 */
export default function RootNavigator() {
  // TODO: Replace with real auth state
  const isSignedIn = false;
  const Stack = createNativeStackNavigator();
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isSignedIn ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
