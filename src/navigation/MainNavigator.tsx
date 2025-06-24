/**
 * @file MainNavigator.tsx
 * @description Main app navigator with bottom tabs for Camera, Chat, Stories, Profile.
 */
import React from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import CameraScreen from '../screens/Main/CameraScreen';
import SendToScreen from '../screens/Main/SendToScreen';
import ChatScreen from '../screens/Main/ChatScreen';
import IndividualChatScreen from '../screens/Main/IndividualChatScreen';
import StoriesScreen from '../screens/Main/StoriesScreen';
import ProfileScreen from '../screens/Main/ProfileScreen';
import SnapPhotoViewer from '../screens/Main/SnapPhotoViewer';
import type { MainTabParamList, CameraStackParamList, ChatStackParamList } from './types';

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
 * Chat stack navigator for chat-related screens
 */
function ChatStackNavigator() {
  const Stack = createNativeStackNavigator<ChatStackParamList>();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ChatList" component={ChatScreen} />
      <Stack.Screen name="IndividualChat" component={IndividualChatScreen} />
      <Stack.Screen name="SnapPhotoViewer" component={SnapPhotoViewer} />
    </Stack.Navigator>
  );
}

/**
 * Main tab navigator with bottom tabs
 */
export default function MainNavigator() {
  const Tab = createBottomTabNavigator<MainTabParamList>();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tab.Screen
        name="Camera"
        component={CameraStackNavigator}
        options={{
          tabBarLabel: 'Camera',
          tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size }}>📷</Text>,
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatStackNavigator}
        options={{
          tabBarLabel: 'Chat',
          tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size }}>💬</Text>,
        }}
      />
      <Tab.Screen
        name="Stories"
        component={StoriesScreen}
        options={{
          tabBarLabel: 'Stories',
          tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size }}>📖</Text>,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size }) => <Text style={{ color, fontSize: size }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
}
