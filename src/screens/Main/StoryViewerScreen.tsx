/**
 * @file StoryViewerScreen.tsx
 * @description Full-screen story viewer scaffold for sequential playback.
 */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';

type StoryViewerRouteParams = {
  userId: string;
  username?: string;
  avatarUrl?: string;
};

export default function StoryViewerScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<Record<string, StoryViewerRouteParams>, string>>();
  const { userId, username, avatarUrl } = route.params || {};

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
      {/* Top bar */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: 16,
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Placeholder for avatar */}
          <View
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: '#333',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>
              {username ? username.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
          <Text style={{ color: 'white', fontSize: 18, fontWeight: 'bold' }}>
            {username || 'User'}
          </Text>
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={{ color: 'white', fontSize: 24 }}>✕</Text>
        </TouchableOpacity>
      </View>
      {/* Story content placeholder */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>Story Viewer</Text>
        <Text style={{ color: 'gray', marginTop: 8 }}>userId: {userId}</Text>
      </View>
    </SafeAreaView>
  );
}
