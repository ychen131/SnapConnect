/**
 * @file DebugInfo.tsx
 * @description Debug component for troubleshooting realtime issues
 */
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import {
  getRealtimeDebugInfo,
  reinitializeRealtimeSubscriptions,
} from '../services/realtimeService';

/**
 * Debug component for troubleshooting realtime issues
 */
export default function DebugInfo() {
  const [isVisible, setIsVisible] = useState(false);
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const user = useSelector((state: RootState) => state.auth.user);
  const realtimeState = useSelector((state: RootState) => state.realtime);

  const refreshDebugInfo = () => {
    const info = getRealtimeDebugInfo();
    setDebugInfo(info);
  };

  const handleReinitialize = async () => {
    if (user?.id) {
      await reinitializeRealtimeSubscriptions(user.id);
      refreshDebugInfo();
    }
  };

  if (!isVisible) {
    return (
      <TouchableOpacity
        onPress={() => {
          setIsVisible(true);
          refreshDebugInfo();
        }}
        style={{
          position: 'absolute',
          top: 50,
          right: 10,
          backgroundColor: 'rgba(0,0,0,0.7)',
          padding: 8,
          borderRadius: 4,
          zIndex: 1000,
        }}
      >
        <Text style={{ color: 'white', fontSize: 12 }}>🐛 Debug</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={{
        position: 'absolute',
        top: 50,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.9)',
        padding: 16,
        borderRadius: 8,
        maxWidth: 300,
        maxHeight: 400,
        zIndex: 1000,
      }}
    >
      <ScrollView>
        <Text style={{ color: 'white', fontSize: 14, fontWeight: 'bold', marginBottom: 8 }}>
          🔧 Realtime Debug Info
        </Text>

        <Text style={{ color: 'white', fontSize: 12, marginBottom: 4 }}>
          Connected: {realtimeState.isConnected ? '✅' : '❌'}
        </Text>

        <Text style={{ color: 'white', fontSize: 12, marginBottom: 4 }}>
          Active Subscriptions: {realtimeState.activeSubscriptions.join(', ') || 'None'}
        </Text>

        <Text style={{ color: 'white', fontSize: 12, marginBottom: 4 }}>
          Message Notifications: {realtimeState.newMessageNotifications.length}
        </Text>

        <Text style={{ color: 'white', fontSize: 12, marginBottom: 4 }}>
          Snap Notifications: {realtimeState.newSnapNotifications.length}
        </Text>

        <Text style={{ color: 'white', fontSize: 12, marginBottom: 4 }}>
          Story Notifications: {realtimeState.newStoryNotifications.length}
        </Text>

        {realtimeState.error && (
          <Text style={{ color: 'red', fontSize: 12, marginBottom: 4 }}>
            Error: {realtimeState.error}
          </Text>
        )}

        {debugInfo && (
          <View style={{ marginTop: 8 }}>
            <Text style={{ color: 'yellow', fontSize: 12, marginBottom: 4 }}>
              Is Initialized: {debugInfo.isInitialized ? '✅' : '❌'}
            </Text>
          </View>
        )}

        <View style={{ flexDirection: 'row', marginTop: 8, gap: 8 }}>
          <TouchableOpacity
            onPress={handleReinitialize}
            style={{
              backgroundColor: '#3B82F6',
              padding: 8,
              borderRadius: 4,
              flex: 1,
            }}
          >
            <Text style={{ color: 'white', fontSize: 12, textAlign: 'center' }}>🔄 Reinit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={refreshDebugInfo}
            style={{
              backgroundColor: '#10B981',
              padding: 8,
              borderRadius: 4,
              flex: 1,
            }}
          >
            <Text style={{ color: 'white', fontSize: 12, textAlign: 'center' }}>🔄 Refresh</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsVisible(false)}
            style={{
              backgroundColor: '#EF4444',
              padding: 8,
              borderRadius: 4,
              flex: 1,
            }}
          >
            <Text style={{ color: 'white', fontSize: 12, textAlign: 'center' }}>✕ Close</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}
