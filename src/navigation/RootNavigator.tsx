/**
 * @file RootNavigator.tsx
 * @description Root navigator that switches between authentication and main app flows.
 */
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import LoginScreen from '../screens/Auth/LoginScreen';
import MainNavigator from './MainNavigator';

/**
 * RootNavigator switches between Auth and Main flows.
 * Uses Redux auth state to determine if user is signed in.
 */
export default function RootNavigator() {
  const user = useSelector((state: RootState) => state.auth.user);
  const isSignedIn = !!user;
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
