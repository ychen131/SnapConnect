/**
 * @file ChatScreen.tsx
 * @description Chat list screen showing all conversations for the current user.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootState } from '../../store';
import { getConversations, type Conversation } from '../../services/chatService';
import {
  getMessageNotifications,
  clearConversationNotifications,
} from '../../services/realtimeService';

/**
 * Displays a list of chat conversations for the current user
 */
export default function ChatScreen({ navigation }: { navigation: any }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const user = useSelector((state: RootState) => state.auth.user);
  const realtimeState = useSelector((state: RootState) => state.realtime);

  // Debug logging for Redux state
  console.log('🔴 ChatScreen - realtimeState:', realtimeState);
  console.log('🔴 ChatScreen - newSnapNotifications:', realtimeState.newSnapNotifications);
  console.log('🔴 ChatScreen - newMessageNotifications:', realtimeState.newMessageNotifications);

  /**
   * Fetches conversations from the database
   */
  async function fetchConversations() {
    if (!user?.id) {
      console.log('❌ No user ID available for fetching conversations');
      return;
    }

    console.log('🔍 Fetching conversations for user:', user.id);
    try {
      const data = await getConversations(user.id);
      console.log('✅ Conversations fetched:', data.length, 'conversations');
      console.log('📋 Conversations data:', data);
      setConversations(data);
    } catch (error) {
      console.error('❌ Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  /**
   * Handles pull-to-refresh
   */
  async function handleRefresh() {
    setIsRefreshing(true);
    await fetchConversations();
  }

  /**
   * Handles tapping on a conversation
   */
  function handleConversationPress(conversation: Conversation) {
    console.log('Opening conversation with:', conversation.other_user_username);
    navigation.navigate('IndividualChat', {
      conversationId: conversation.id,
      otherUserId: conversation.other_user_id,
      otherUsername: conversation.other_user_username,
    });
  }

  /**
   * Renders a single conversation item
   */
  function renderConversationItem({ item }: { item: Conversation }) {
    const getLastMessagePreview = () => {
      if (item.last_message_type === 'photo') {
        return '📸 Photo';
      } else if (item.last_message_type === 'video') {
        return '🎬 Video';
      } else {
        return item.last_message_content || 'No messages yet';
      }
    };

    const getAvatarText = () => {
      return item.other_user_username.charAt(0).toUpperCase();
    };

    // Check for realtime notifications for this conversation
    const notification = realtimeState.newMessageNotifications.find(
      (n) => n.conversationId === item.id,
    );

    const totalUnreadCount = item.unread_count + (notification?.count || 0);
    const showBadge = totalUnreadCount > 0;

    return (
      <TouchableOpacity
        onPress={() => handleConversationPress(item)}
        className="flex-row items-center border-b border-gray-200 bg-white p-4"
      >
        {/* Avatar */}
        <View className="mr-3 h-12 w-12 items-center justify-center rounded-full bg-blue-500">
          {item.other_user_avatar_url ? (
            <Text className="text-lg font-semibold text-white">
              {/* TODO: Add Image component for avatar */}
              {getAvatarText()}
            </Text>
          ) : (
            <Text className="text-lg font-semibold text-white">{getAvatarText()}</Text>
          )}
        </View>

        {/* Conversation Info */}
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-base font-semibold text-gray-900">
              {item.other_user_username}
            </Text>
            <Text className="text-sm text-gray-500">
              {new Date(item.last_message_at).toLocaleDateString()}
            </Text>
          </View>

          <View className="mt-1 flex-row items-center justify-between">
            <Text className="flex-1 text-sm text-gray-600" numberOfLines={1}>
              {getLastMessagePreview()}
            </Text>

            {/* Unread Badge - combine database count with realtime notifications */}
            {showBadge && (
              <View className="ml-2 h-5 min-w-[20px] items-center justify-center rounded-full bg-red-500">
                <Text className="text-xs font-semibold text-white">
                  {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  /**
   * Renders empty state when no conversations exist
   */
  function renderEmptyState() {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Text className="mb-2 text-center text-lg text-gray-500">No conversations yet</Text>
        <Text className="text-center text-sm text-gray-400">
          Start sending snaps to friends to see your conversations here!
        </Text>
      </View>
    );
  }

  /**
   * Renders realtime connection status indicator
   */
  function renderConnectionStatus() {
    if (!realtimeState.isConnected) {
      return (
        <View className="bg-yellow-100 px-4 py-2">
          <Text className="text-center text-sm text-yellow-800">
            🔌 Connecting to real-time updates...
          </Text>
        </View>
      );
    }
    return null;
  }

  // Load conversations on mount
  useEffect(() => {
    fetchConversations();
  }, [user?.id]);

  // Refresh conversations when screen comes into focus (e.g., returning from a chat)
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 ChatScreen focused - refreshing conversations');
      fetchConversations();
      // Note: Notifications are cleared when user presses the Chat tab in CustomTabBar
      // This prevents premature clearing when notifications are added while user is on ChatScreen
    }, [user?.id]),
  );

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-500">Loading conversations...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <SafeAreaView edges={['top']} className="bg-white">
        <View className="border-b border-gray-200 px-4 py-3">
          <Text className="text-xl font-bold text-gray-900">Chats</Text>
        </View>
        {renderConnectionStatus()}
      </SafeAreaView>

      {/* Conversations List */}
      <FlatList
        data={conversations}
        renderItem={renderConversationItem}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#3B82F6']}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}
