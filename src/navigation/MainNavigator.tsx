/**
 * @file MainNavigator.tsx
 * @description Main app navigator with bottom tabs for Camera, Chat, Stories, Profile.
 */
import React, { useEffect } from 'react';
import { Text } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import {
  initializeRealtimeSubscriptions,
  cleanupRealtimeSubscriptions,
} from '../services/realtimeService';
import CameraScreen from '../screens/Main/CameraScreen';
import SendToScreen from '../screens/Main/SendToScreen';
import ChatScreen from '../screens/Main/ChatScreen';
import IndividualChatScreen from '../screens/Main/IndividualChatScreen';
import StoriesScreen from '../screens/Main/StoriesScreen';
import ProfileScreen from '../screens/Main/ProfileScreen';
import AddFriendsScreen from '../screens/Main/AddFriendsScreen';
import MyStoriesScreen from '../screens/Main/MyStoriesScreen';
import SnapPhotoViewer from '../screens/Main/SnapPhotoViewer';
import SnapVideoViewer from '../screens/Main/SnapVideoViewer';
import StoryViewerScreen from '../screens/Main/StoryViewerScreen';
import CustomTabBar from '../components/CustomTabBar';
import SettingsScreen from '../screens/Main/SettingsScreen';
import type {
  MainTabParamList,
  CameraStackParamList,
  ChatStackParamList,
  ProfileStackParamList,
} from './types';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
      <Stack.Screen name="SnapVideoViewer" component={SnapVideoViewer} />
    </Stack.Navigator>
  );
}

/**
 * Profile stack navigator for profile-related screens
 */
function ProfileStackNavigator() {
  const Stack = createNativeStackNavigator<ProfileStackParamList>();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileMain" component={ProfileScreen} />
      <Stack.Screen name="AddFriends" component={AddFriendsScreen} />
      <Stack.Screen name="MyStories" component={MyStoriesScreen} />
      <Stack.Screen name="StoryViewer" component={StoryViewerScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

/**
 * Stories stack navigator for stories feed and viewer
 */
function StoriesStackNavigator() {
  const Stack = createNativeStackNavigator();
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="StoriesMain" component={StoriesScreen} />
      <Stack.Screen name="StoryViewer" component={StoryViewerScreen} />
    </Stack.Navigator>
  );
}

/**
 * Main tab navigator with bottom tabs
 */
export default function MainNavigator() {
  const Tab = createBottomTabNavigator<MainTabParamList>();
  const user = useSelector((state: RootState) => state.auth.user);

  // Initialize realtime subscriptions when user is authenticated
  useEffect(() => {
    if (user?.id) {
      initializeRealtimeSubscriptions(user.id).catch((error) => {
        console.error('❌ Failed to initialize realtime subscriptions:', error);
      });
    }

    // Cleanup on unmount
    return () => {
      cleanupRealtimeSubscriptions();
    };
  }, [user?.id]);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen
        name="Camera"
        component={CameraStackNavigator}
        options={{
          tabBarLabel: 'Camera',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name="camera-outline"
              size={size}
              color={focused ? '#FF8C69' : '#6B7280'}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Chat"
        component={ChatStackNavigator}
        options={{
          tabBarLabel: 'Chat',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name="message-text-outline"
              size={size}
              color={focused ? '#FF8C69' : '#6B7280'}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Stories"
        component={StoriesStackNavigator}
        options={{
          tabBarLabel: 'Stories',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name="book-open-page-variant-outline"
              size={size}
              color={focused ? '#FF8C69' : '#6B7280'}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNavigator}
        options={{
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, size, focused }) => (
            <MaterialCommunityIcons
              name="account-circle-outline"
              size={size}
              color={focused ? '#FF8C69' : '#6B7280'}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}
