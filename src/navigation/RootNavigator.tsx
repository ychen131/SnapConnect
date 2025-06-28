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
import SignupScreen from '../screens/Auth/SignupScreen';
import MainNavigator from './MainNavigator';
import { navigationRef } from './navigationRef';

/**
 * AuthNavigator handles navigation between login and signup screens.
 */
function AuthNavigator() {
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}

/**
 * RootNavigator switches between Auth and Main flows.
 * Uses Redux auth state to determine if user is signed in.
 */
export default function RootNavigator() {
  const user = useSelector((state: RootState) => state.auth.user);
  const isSignedIn = !!user;
  const Stack = createNativeStackNavigator();
  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isSignedIn ? (
          <Stack.Screen name="Main" component={MainNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
