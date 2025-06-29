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
import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { RootState } from '../../store';
import { getConversations, type Conversation } from '../../services/chatService';
import {
  getMessageNotifications,
  clearConversationNotifications,
  clearAllMessageNotifications,
} from '../../services/realtimeService';
import { clearAllMessageNotifications as clearAllMessageNotificationsSlice } from '../../store/realtimeSlice';
import DebugInfo from '../../components/DebugInfo';
import Avatar from '../../components/ui/Avatar';
import tailwindConfig from '../../../tailwind.config';

/**
 * Displays a list of chat conversations for the current user
 */
export default function ChatScreen({ navigation }: { navigation: any }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const user = useSelector((state: RootState) => state.auth.user);
  const realtimeState = useSelector((state: RootState) => state.realtime);
  const dispatch = useDispatch();

  // Safely access tailwind config with fallbacks
  const brandLight = (tailwindConfig?.theme?.extend?.colors as any)?.brand?.light || '#FFF0E6';
  const textPrimary = (tailwindConfig?.theme?.extend?.colors as any)?.['text-primary'] || '#2D2D2D';
  const muted = (tailwindConfig?.theme?.extend?.colors as any)?.muted || '#AAB0B7';
  const errorColor = (tailwindConfig?.theme?.extend?.colors as any)?.error || '#ef4444';
  const background = (tailwindConfig?.theme?.extend?.colors as any)?.background || '#FFFFFF';

  /**
   * Fetches conversations from the database
   */
  async function fetchConversations() {
    if (!user?.id) {
      return;
    }

    try {
      const data = await getConversations(user.id);
      setConversations(data);
    } catch (error) {
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

    // Check for realtime notifications for this conversation
    const notification = realtimeState.newMessageNotifications.find(
      (n) => n.conversationId === item.id,
    );

    const totalUnreadCount = item.unread_count + (notification?.count || 0);
    const showBadge = totalUnreadCount > 0;

    return (
      <TouchableOpacity
        onPress={() => handleConversationPress(item)}
        className="flex-row items-center border-b border-gray-200"
        style={{
          backgroundColor: `rgba(${parseInt(background.slice(1, 3), 16)},${parseInt(background.slice(3, 5), 16)},${parseInt(background.slice(5, 7), 16)},0.9)`,
          padding: 16,
        }}
      >
        {/* Avatar */}
        <View className="relative mr-3">
          <Avatar
            avatarUrl={item.other_user_avatar_url}
            username={item.other_user_username}
            size={48}
            backgroundColor="#FF8C69"
            textColor="#FFFFFF"
          />

          {/* Unread Badge - combine database count with realtime notifications */}
          {showBadge && (
            <View
              className="absolute -right-1 -top-1 h-5 min-w-[20px] items-center justify-center rounded-full"
              style={{ backgroundColor: errorColor }}
            >
              <Text
                style={{ fontFamily: 'Nunito', fontSize: 12, fontWeight: '600', color: '#fff' }}
              >
                {totalUnreadCount > 99 ? '99+' : totalUnreadCount}
              </Text>
            </View>
          )}
        </View>

        {/* Conversation Info */}
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text
              style={{ fontFamily: 'Nunito', fontSize: 16, fontWeight: '700', color: textPrimary }}
            >
              {item.other_user_username}
            </Text>
            <Text style={{ fontFamily: 'Nunito', fontSize: 14, color: muted }}>
              {new Date(item.last_message_at).toLocaleDateString()}
            </Text>
          </View>

          <View className="mt-1 flex-row items-center justify-between">
            <Text style={{ fontFamily: 'Nunito', fontSize: 14, color: muted }} numberOfLines={1}>
              {getLastMessagePreview()}
            </Text>
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
        <Text className="mb-2 text-center font-heading text-lg text-muted">
          No conversations yet
        </Text>
        <Text className="text-center font-heading text-sm text-muted">
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
          <Text className="text-center font-heading text-sm text-yellow-800">
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
      fetchConversations();
      // Note: Notifications are cleared when user presses the Chat tab in CustomTabBar
      // This prevents premature clearing when notifications are added while user is on ChatScreen
    }, [user?.id]),
  );

  // After fetching conversations, clear notifications if all are read
  useEffect(() => {
    if (
      conversations.length > 0 &&
      conversations.every((conv) => conv.unread_count === 0) &&
      realtimeState.newMessageNotifications.length === 0
    ) {
      dispatch(clearAllMessageNotificationsSlice());
    }
  }, [conversations, realtimeState.newMessageNotifications.length]);

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1" style={{ backgroundColor: brandLight }}>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text className="mt-4 text-gray-500">Loading conversations...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: brandLight }}>
      {/* Header */}
      <View className="px-4 pb-2 pt-4" style={{ backgroundColor: brandLight }}>
        <Text className="text-text-primary font-heading text-2xl font-extrabold">Chats</Text>
      </View>
      {renderConnectionStatus()}

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

      {/* Debug Info Component */}
      <DebugInfo />
    </SafeAreaView>
  );
}
