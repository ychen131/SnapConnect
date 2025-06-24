/**
 * @file MainNavigator.tsx
 * @description Main app navigator with bottom tabs for Camera, Chat, Stories, Profile.
 */
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import CameraScreen from '../screens/Main/CameraScreen';
import ChatScreen from '../screens/Main/ChatScreen';
import StoriesScreen from '../screens/Main/StoriesScreen';
import ProfileScreen from '../screens/Main/ProfileScreen';

/**
 * MainNavigator for signed-in users with bottom tabs.
 */
export default function MainNavigator() {
  const Tab = createBottomTabNavigator();
  return (
    <Tab.Navigator>
      <Tab.Screen name="Camera" component={CameraScreen} />
      <Tab.Screen name="Chat" component={ChatScreen} />
      <Tab.Screen name="Stories" component={StoriesScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}
