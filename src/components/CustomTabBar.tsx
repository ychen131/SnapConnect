/**
 * @file CustomTabBar.tsx
 * @description Custom bottom tab bar with notification badge support.
 */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useSelector } from 'react-redux';
import type { RootState } from '../store';
import { clearAllNotifications, clearAllStoryNotifications } from '../services/realtimeService';
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
      console.log('🔴 Chat tab red dot: Snap notifications found:', unreadSnaps.length);
      return true;
    }

    // Check if there are any message notifications
    if (realtimeState.newMessageNotifications.length > 0) {
      console.log(
        '🔴 Chat tab red dot: Message notifications found:',
        realtimeState.newMessageNotifications.length,
      );
      return true;
    }

    console.log('🔴 Chat tab red dot: No notifications found');
    return false;
  };

  const shouldShowRedDot = hasUnreadMessages();

  // Check for story notifications
  const hasUnreadStories = realtimeState.newStoryNotifications.length > 0;

  // Debug logging
  React.useEffect(() => {
    console.log('🔴 CustomTabBar state:', {
      snapNotifications: unreadSnaps.length,
      messageNotifications: realtimeState.newMessageNotifications.length,
      storyNotifications: realtimeState.newStoryNotifications.length,
      shouldShowRedDot,
      hasUnreadStories,
    });
  }, [
    unreadSnaps.length,
    realtimeState.newMessageNotifications.length,
    realtimeState.newStoryNotifications.length,
    shouldShowRedDot,
    hasUnreadStories,
  ]);

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
              console.log('🧹 Clearing all notifications when Chat tab pressed');
              clearAllNotifications();
            }

            // Clear story notifications when Stories tab is pressed
            if (route.name === 'Stories' && hasUnreadStories) {
              console.log('🧹 Clearing story notifications when Stories tab pressed');
              clearAllStoryNotifications();
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

              {/* Show red dot badge on Stories tab when there are unread stories */}
              {route.name === 'Stories' && (
                <Badge visible={hasUnreadStories} size={8} color="#EF4444" />
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
