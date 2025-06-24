/**
 * @file PermissionNavigator.tsx
 * @description Navigator that handles permission flow and main app navigation.
 */
import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector, useDispatch } from 'react-redux';
import type { RootState } from '../store';
import { setPermissionsRequested } from '../store/authSlice';
import { checkAllPermissionsGranted } from '../services/permissionService';
import PermissionScreen from '../screens/Auth/PermissionScreen';
import MainNavigator from './MainNavigator';

/**
 * PermissionNavigator handles the flow between permission requests and main app.
 * It checks if permissions have been requested before and if they're currently granted.
 */
export default function PermissionNavigator() {
  const Stack = createNativeStackNavigator();
  const dispatch = useDispatch();
  const permissionsRequested = useSelector((state: RootState) => state.auth.permissionsRequested);
  const [initialRoute, setInitialRoute] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    async function determineInitialRoute() {
      console.log('🔍 PermissionNavigator: Starting route determination');
      console.log('🔍 PermissionNavigator: permissionsRequested =', permissionsRequested);

      try {
        // If permissions haven't been requested before, show permission screen
        if (!permissionsRequested) {
          console.log(
            '🔍 PermissionNavigator: Permissions not requested, showing permission screen',
          );
          setInitialRoute('Permissions');
          return;
        }

        console.log(
          '🔍 PermissionNavigator: Permissions previously requested, checking current status',
        );
        // If permissions have been requested before, check if they're still granted
        const permissionsGranted = await checkAllPermissionsGranted();
        console.log('🔍 PermissionNavigator: Current permissions granted =', permissionsGranted);

        if (permissionsGranted) {
          console.log('🔍 PermissionNavigator: Permissions granted, going to main app');
          setInitialRoute('Main');
        } else {
          // Permissions were previously requested but are now denied
          // Show permission screen again
          console.log(
            '🔍 PermissionNavigator: Permissions denied, showing permission screen again',
          );
          setInitialRoute('Permissions');
        }
      } catch (error) {
        console.error('🔍 PermissionNavigator: Error checking permissions:', error);
        // Default to permission screen on error
        setInitialRoute('Permissions');
      } finally {
        setIsChecking(false);
        console.log(
          '🔍 PermissionNavigator: Route determination complete, initialRoute =',
          initialRoute,
        );
      }
    }

    determineInitialRoute();
  }, [permissionsRequested]);

  // Show loading or wait until we determine the initial route
  if (isChecking || !initialRoute) {
    console.log('🔍 PermissionNavigator: Still checking or no initial route, showing loading');
    return null; // Or a loading component
  }

  console.log('🔍 PermissionNavigator: Rendering navigator with initialRoute =', initialRoute);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName={initialRoute}>
      <Stack.Screen
        name="Permissions"
        component={PermissionScreen}
        options={{ gestureEnabled: false }}
      />
      <Stack.Screen name="Main" component={MainNavigator} options={{ gestureEnabled: false }} />
    </Stack.Navigator>
  );
}
