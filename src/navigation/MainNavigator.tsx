/**
 * @file MainNavigator.tsx
 * @description Main app navigator with bottom tabs for Camera, Chat, Stories, Profile.
 */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CameraScreen from '../screens/Main/CameraScreen';
import SendToScreen from '../screens/Main/SendToScreen';
import ChatScreen from '../screens/Main/ChatScreen';
import StoriesScreen from '../screens/Main/StoriesScreen';
import ProfileScreen from '../screens/Main/ProfileScreen';
import type { MainTabParamList, CameraStackParamList } from './types';

/**
 * Camera stack navigator for camera-related screens
 */
function CameraStackNavigator() {
  const Stack = createNativeStackNavigator<CameraStackParamList>();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CameraMain" component={CameraScreen} />
      <Stack.Screen name="SendTo" component={SendToScreen} />
    </Stack.Navigator>
  );
}

/**
 * MainNavigator for signed-in users with bottom tabs.
 */
export default function MainNavigator() {
  const Tab = createBottomTabNavigator<MainTabParamList>();
  return (
    <Tab.Navigator>
      <Tab.Screen name="Camera" component={CameraStackNavigator} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Stories" component={StoriesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
