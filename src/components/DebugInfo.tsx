/**
 * @file DebugInfo.tsx
 * @description Debug component to show current app state for troubleshooting.
 */
import React from 'react';
import { View, Text } from 'react-native';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';

/**
 * Debug component to show current Redux state
 */
export default function DebugInfo() {
  const authState = useSelector((state: RootState) => state.auth);

  return (
    <View
      style={{
        position: 'absolute',
        top: 50,
        left: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.8)',
        padding: 10,
        borderRadius: 5,
      }}
    >
      <Text style={{ color: 'white', fontSize: 12 }}>Debug Info:</Text>
      <Text style={{ color: 'white', fontSize: 10 }}>
        User: {authState.user ? 'Logged in' : 'Not logged in'}
      </Text>
      <Text style={{ color: 'white', fontSize: 10 }}>User ID: {authState.user?.id || 'None'}</Text>
      <Text style={{ color: 'white', fontSize: 10 }}>
        Permissions Requested: {authState.permissionsRequested ? 'Yes' : 'No'}
      </Text>
      <Text style={{ color: 'white', fontSize: 10 }}>
        Loading: {authState.isLoading ? 'Yes' : 'No'}
      </Text>
      <Text style={{ color: 'white', fontSize: 10 }}>Error: {authState.error || 'None'}</Text>
    </View>
  );
}
