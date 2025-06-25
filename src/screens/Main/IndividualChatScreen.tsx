/**
 * @file IndividualChatScreen.tsx
 * @description Individual chat screen showing message history for a specific conversation.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { getMessages, markMessagesAsViewed, Message } from '../../services/chatService';
import { Video, ResizeMode } from 'expo-av';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../services/supabase';

interface IndividualChatScreenProps {
  navigation: any;
  route: {
    params: {
      conversationId: string;
      otherUserId: string;
      otherUsername: string;
    };
  };
}

/**
 * Displays individual chat screen with message history
 */
export default function IndividualChatScreen({ navigation, route }: IndividualChatScreenProps) {
  const { conversationId, otherUserId, otherUsername } = route.params;
  const user = useSelector((state: RootState) => state.auth.user);

  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [newMessage, setNewMessage] = useState('');

  /**
   * Fetches messages for this conversation
   */
  async function fetchMessages() {
    if (!user?.id) return;

    try {
      const data = await getMessages(conversationId, user.id);
      setMessages(data);

      // Mark messages as viewed when opening the chat
      await markMessagesAsViewed(conversationId, user.id);
    } catch (error) {
      console.error('Error fetching messages:', error);
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
    await fetchMessages();
  }

  /**
   * Handles going back to chat list
   */
  function handleBack() {
    navigation.goBack();
  }

  /**
   * Handles tapping a message (for photo and video viewing)
   */
  function handleMessagePress(item: Message) {
    if (item.message_type === 'photo' && item.media_url) {
      navigation.navigate('SnapPhotoViewer', {
        messageId: item.id,
        photoUrl: item.media_url,
        timer: item.timer || 3,
        conversationId,
        userId: user!.id,
      });
    } else if (item.message_type === 'video' && item.media_url) {
      navigation.navigate('SnapVideoViewer', {
        messageId: item.id,
        videoUrl: item.media_url,
        conversationId,
        userId: user!.id,
      });
    }
  }

  /**
   * Handles sending a new text message
   */
  async function handleSendMessage() {
    if (!newMessage.trim() || !user?.id) return;
    try {
      // Insert new text message (not a reply)
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        recipient_id: otherUserId,
        message_type: 'text',
        content: newMessage.trim(),
        is_viewed: false,
      });
      if (error) {
        console.error('❌ Error sending message:', error);
        return;
      }
      setNewMessage('');
      // Refresh messages
      await fetchMessages();
    } catch (err) {
      console.error('❌ Error sending message:', err);
    }
  }

  /**
   * Renders a single message
   */
  function renderMessage({ item, index }: { item: Message; index: number }) {
    const isOwnMessage = item.sender_id === user?.id;
    const messageTime = new Date(item.created_at).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    // Check if this is a reply
    const isReply = !!item.reply_to_message_id;
    const originalMessage = item.original_message;

    // Handler for tapping the reply context
    function handleReplyContextPress() {
      if (!originalMessage) return;
      if (originalMessage.message_type === 'photo' && originalMessage.media_url) {
        navigation.navigate('SnapPhotoViewer', {
          messageId: originalMessage.id,
          photoUrl: originalMessage.media_url,
          timer: originalMessage.timer || 3,
          conversationId,
          userId: user!.id,
        });
      } else if (originalMessage.message_type === 'video' && originalMessage.media_url) {
        navigation.navigate('SnapVideoViewer', {
          messageId: originalMessage.id,
          videoUrl: originalMessage.media_url,
          conversationId,
          userId: user!.id,
        });
      } else {
        // For text, scroll to and highlight (placeholder for now)
        // TODO: Implement scroll-to and highlight for text
        // You could use refs and FlatList's scrollToIndex
        // For now, just show an alert
        alert('Jump to original text message coming soon!');
      }
    }

    const renderMessageContent = () => {
      switch (item.message_type) {
        case 'photo':
          return (
            <View className="rounded-lg bg-gray-200 p-2">
              <Text className="text-sm text-gray-600">📸 Photo</Text>
              {item.timer && (
                <Text className="mt-1 text-xs text-gray-500">Timer: {item.timer}s</Text>
              )}
            </View>
          );

        case 'video':
          return (
            <View className="rounded-lg bg-gray-200 p-2">
              <Text className="text-sm text-gray-600">🎬 Video</Text>
            </View>
          );

        case 'text':
          return (
            <View>
              {isReply && originalMessage && (
                <TouchableOpacity
                  className="mb-1 rounded bg-gray-100 p-2"
                  onPress={handleReplyContextPress}
                  activeOpacity={0.7}
                >
                  <Text className="text-xs text-blue-600 underline">
                    ↩️ Replying to{' '}
                    {originalMessage.message_type === 'photo'
                      ? '📸 Photo'
                      : originalMessage.message_type === 'video'
                        ? '🎬 Video'
                        : originalMessage.content || 'message'}
                  </Text>
                </TouchableOpacity>
              )}
              <Text className="text-base text-gray-800">{item.content || 'No content'}</Text>
            </View>
          );

        default:
          return <Text className="text-base text-gray-800">{item.content || 'No content'}</Text>;
      }
    };

    return (
      <TouchableOpacity
        onPress={() => handleMessagePress(item)}
        activeOpacity={
          (item.message_type === 'photo' || item.message_type === 'video') && item.media_url
            ? 0.7
            : 1
        }
      >
        <View
          className={`flex-row ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3 px-4`}
          style={{
            marginLeft: isReply ? 20 : 0,
            borderLeftWidth: isReply ? 2 : 0,
            borderLeftColor: '#3B82F6',
            paddingLeft: isReply ? 8 : 0,
          }}
        >
          <View
            className={`max-w-[70%] ${isOwnMessage ? 'bg-blue-500' : 'bg-gray-200'} rounded-lg p-3`}
            style={{
              opacity: isReply ? 0.9 : 1,
            }}
          >
            {renderMessageContent()}
            <Text className={`mt-1 text-xs ${isOwnMessage ? 'text-blue-100' : 'text-gray-500'}`}>
              {messageTime}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  }

  /**
   * Renders empty state when no messages exist
   */
  function renderEmptyState() {
    return (
      <View className="flex-1 items-center justify-center p-8">
        <Text className="mb-2 text-center text-lg text-gray-500">No messages yet</Text>
        <Text className="text-center text-sm text-gray-400">
          Start the conversation by sending a snap!
        </Text>
      </View>
    );
  }

  // Load messages on mount
  useEffect(() => {
    fetchMessages();

    // Set up Supabase Realtime subscription for messages in this conversation
    const channel = supabase
      .channel('realtime-messages-' + conversationId)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          console.log('Realtime event:', payload); // Debug log
          fetchMessages();
        },
      )
      .subscribe();

    // Clean up subscription on unmount
    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, user?.id]);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-500">Loading messages...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <SafeAreaView edges={['top']} className="bg-white">
        <View className="flex-row items-center border-b border-gray-200 bg-white px-4 py-3">
          <TouchableOpacity onPress={handleBack} className="mr-3">
            <Text className="text-lg text-blue-500">←</Text>
          </TouchableOpacity>

          <View className="flex-1">
            <Text className="text-lg font-semibold text-gray-900">{otherUsername}</Text>
            <Text className="text-sm text-gray-500">{messages.length} messages</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Messages List */}
      <FlatList
        data={messages}
        renderItem={renderMessage}
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
        inverted={false}
      />

      {/* Text Input and Send Button */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <View className="flex-row items-center border-t border-gray-200 bg-white px-4 py-2">
          <TextInput
            className="flex-1 rounded-lg bg-gray-100 px-4 py-3 text-gray-800"
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
            style={{ minHeight: 40, maxHeight: 100 }}
          />
          <TouchableOpacity
            className="ml-2 rounded-full bg-blue-500 px-4 py-2"
            onPress={handleSendMessage}
            disabled={!newMessage.trim()}
            activeOpacity={newMessage.trim() ? 0.7 : 1}
          >
            <Text className="font-semibold text-white">Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
