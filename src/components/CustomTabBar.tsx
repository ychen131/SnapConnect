/**
 * @file CustomTabBar.tsx
 * @description Custom bottom tab bar with notification badge support.
 */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { clearAllNotifications } from '../services/realtimeService';
import { Badge } from './ui/Badge';

/**
 * Props for the CustomTabBar component.
 */
interface CustomTabBarProps {
  state: any;
  descriptors: any;
  navigation: any;
}

/**
 * Custom tab bar component with notification badge on Chat tab.
 */
export default function CustomTabBar({ state, descriptors, navigation }: CustomTabBarProps) {
  // Get unread snap count from Redux
  const unreadSnaps = useSelector((state: RootState) => state.realtime.newSnapNotifications);
  const realtimeState = useSelector((state: RootState) => state.realtime);

  // Calculate total unread messages across all conversations
  const hasUnreadMessages = () => {
    // Check if there are any snap notifications
    if (unreadSnaps.length > 0) {
      console.log('🔴 CustomTabBar: Has unread snaps, showing red dot');
      return true;
    }

    // Check if there are any message notifications
    if (realtimeState.newMessageNotifications.length > 0) {
      console.log('🔴 CustomTabBar: Has message notifications, showing red dot');
      console.log(
        '🔴 CustomTabBar: Message notifications details:',
        realtimeState.newMessageNotifications,
      );
      return true;
    }

    console.log('🔴 CustomTabBar: No unread messages, hiding red dot');
    // Note: We can't directly access conversation unread counts from the database here
    // because this component doesn't have access to the conversation data.
    // The unread counts will be reflected in the realtime notifications.
    return false;
  };

  const shouldShowRedDot = hasUnreadMessages();

  // Debug logging
  console.log('🔴 CustomTabBar - unreadSnaps:', unreadSnaps);
  console.log('🔴 CustomTabBar - newMessageNotifications:', realtimeState.newMessageNotifications);
  console.log('🔴 CustomTabBar - shouldShowRedDot:', shouldShowRedDot);

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: 'white',
        borderTopWidth: 1,
        borderTopColor: '#E5E7EB',
        paddingBottom: 20,
        paddingTop: 10,
      }}
    >
      {state.routes.map((route: any, index: number) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel ?? route.name;

        const isFocused = state.index === index;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            // Clear all notifications when Chat tab is pressed
            if (route.name === 'Chat' && shouldShowRedDot) {
              console.log('🧹 Clearing all notifications - Chat tab pressed');
              clearAllNotifications();
            }
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({
            type: 'tabLongPress',
            target: route.key,
          });
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarTestID}
            onPress={onPress}
            onLongPress={onLongPress}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <View style={{ position: 'relative' }}>
              <Text
                style={{
                  fontSize: 24,
                  color: isFocused ? '#3B82F6' : '#6B7280',
                }}
              >
                {options.tabBarIcon?.({ color: isFocused ? '#3B82F6' : '#6B7280', size: 24 })}
              </Text>

              {/* Show red dot badge on Chat tab when there are unread messages */}
              {route.name === 'Chat' && (
                <Badge visible={shouldShowRedDot} size={8} color="#EF4444" />
              )}
            </View>

            <Text
              style={{
                fontSize: 12,
                color: isFocused ? '#3B82F6' : '#6B7280',
                marginTop: 4,
                fontWeight: isFocused ? '600' : '400',
              }}
            >
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
