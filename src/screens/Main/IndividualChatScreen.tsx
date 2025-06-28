/**
 * @file IndividualChatScreen.tsx
 * @description Individual chat screen showing message history for a specific conversation.
 */
import React, { useState, useEffect, useRef } from 'react';
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
  ActionSheetIOS,
  Alert,
  Modal,
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
  const flatListRef = useRef<FlatList>(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);
  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [replyToMessage, setReplyToMessage] = useState<Message | null>(null);
  const [replyText, setReplyText] = useState('');

  /**
   * Fetches messages for this conversation
   */
  async function fetchMessages() {
    if (!user?.id) return;

    try {
      const data = await getMessages(conversationId, user.id);
      setMessages(data);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
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

  async function handleSendTextReply() {
    if (!replyText.trim() || !user?.id || !replyToMessage) return;
    try {
      const { error } = await supabase.from('messages').insert({
        conversation_id: conversationId,
        sender_id: user.id,
        recipient_id: otherUserId,
        message_type: 'text',
        content: replyText.trim(),
        reply_to_message_id: replyToMessage.id,
        is_viewed: false,
      });
      if (error) {
        console.error('❌ Error sending reply:', error);
        return;
      }
      setReplyText('');
      setReplyModalVisible(false);
      setReplyToMessage(null);
      await fetchMessages();
    } catch (err) {
      console.error('❌ Error sending reply:', err);
    }
  }

  function handleLongPressMessage(item: Message) {
    if (item.message_type !== 'text') return;
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Reply'],
          cancelButtonIndex: 0,
          userInterfaceStyle: 'light',
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            setReplyToMessage(item);
            setReplyModalVisible(true);
          }
        },
      );
    } else {
      // For Android, use Alert as a simple ActionSheet replacement
      Alert.alert('Message Options', '', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reply',
          onPress: () => {
            setReplyToMessage(item);
            setReplyModalVisible(true);
          },
        },
      ]);
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
        // For text, scroll to and highlight
        const idx = messages.findIndex((msg) => msg.id === originalMessage.id);
        if (idx !== -1) {
          flatListRef.current?.scrollToIndex({ index: idx, animated: true });
          setHighlightedMessageId(originalMessage.id);
          setTimeout(() => setHighlightedMessageId(null), 1200);
        } else {
          alert('Original message not found.');
        }
      }
    }

    const renderMessageContent = () => {
      switch (item.message_type) {
        case 'photo':
          return (
            <View className="rounded-lg bg-gray-200 p-2">
              <Text className="font-heading text-sm text-muted">📸 Photo</Text>
              {item.timer && (
                <Text className="mt-1 font-heading text-xs text-muted">Timer: {item.timer}s</Text>
              )}
            </View>
          );

        case 'video':
          return (
            <View className="rounded-lg bg-gray-200 p-2">
              <Text className="font-heading text-sm text-muted">🎬 Video</Text>
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
                  <Text className="font-heading text-xs text-brand underline">
                    ↩️ Replying to{' '}
                    {originalMessage.message_type === 'photo'
                      ? '📸 Photo'
                      : originalMessage.message_type === 'video'
                        ? '🎬 Video'
                        : originalMessage.content || 'message'}
                  </Text>
                </TouchableOpacity>
              )}
              <Text className="text-text-primary font-heading text-base">
                {item.content || 'No content'}
              </Text>
            </View>
          );

        default:
          return (
            <Text className="text-text-primary font-heading text-base">
              {item.content || 'No content'}
            </Text>
          );
      }
    };

    // Highlight style for jump-to-original
    const highlightStyle =
      highlightedMessageId === item.id
        ? { backgroundColor: '#FEF08A' } // yellow-100
        : {};

    return (
      <TouchableOpacity
        onPress={() => handleMessagePress(item)}
        onLongPress={() => handleLongPressMessage(item)}
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
            borderLeftColor: '#FF8C69',
            paddingLeft: isReply ? 8 : 0,
            ...highlightStyle,
          }}
        >
          <View
            className={`max-w-[70%] ${isOwnMessage ? 'bg-brand' : 'bg-gray-200'} rounded-lg p-3`}
            style={{
              opacity: isReply ? 0.9 : 1,
            }}
          >
            {renderMessageContent()}
            <Text
              className={`mt-1 font-heading text-xs ${isOwnMessage ? 'text-white' : 'text-muted'}`}
            >
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
        <Text className="mb-2 text-center font-heading text-lg text-muted">No messages yet</Text>
        <Text className="text-center font-heading text-sm text-muted">
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
        <ActivityIndicator size="large" color="#FF8C69" />
        <Text className="mt-4 font-heading text-muted">Loading messages...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <SafeAreaView edges={['top']} className="bg-white">
        <View className="flex-row items-center border-b border-gray-200 bg-white px-4 py-3">
          <TouchableOpacity onPress={handleBack} className="mr-3">
            <Text className="font-heading text-lg text-brand">←</Text>
          </TouchableOpacity>

          <View className="flex-1">
            <Text className="text-text-primary font-heading text-lg font-semibold">
              {otherUsername}
            </Text>
            <Text className="font-heading text-sm text-muted">{messages.length} messages</Text>
          </View>
        </View>
      </SafeAreaView>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#FF8C69']}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        inverted={false}
        onContentSizeChange={() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }}
      />

      {/* Text Input and Send Button */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <View className="flex-row items-center border-t border-gray-200 bg-white px-4 py-2">
          <TextInput
            className="text-text-primary flex-1 rounded-lg bg-gray-100 px-4 py-3 font-heading"
            placeholder="Type a message..."
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            maxLength={500}
            style={{ minHeight: 40, maxHeight: 100 }}
          />
          <TouchableOpacity
            className="ml-2 rounded-full bg-brand px-4 py-2"
            onPress={handleSendMessage}
            disabled={!newMessage.trim()}
            activeOpacity={newMessage.trim() ? 0.7 : 1}
          >
            <Text className="font-heading font-semibold text-white">Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Reply Modal for text messages */}
      {replyToMessage && (
        <Modal
          visible={replyModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setReplyModalVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', justifyContent: 'center' }}>
            <View style={{ margin: 24, backgroundColor: 'white', borderRadius: 12, padding: 20 }}>
              <Text style={{ fontFamily: 'Nunito', fontWeight: 'bold', marginBottom: 8 }}>
                Replying to:
              </Text>
              <Text
                style={{ fontFamily: 'Nunito', color: '#AAB0B7', marginBottom: 16 }}
                numberOfLines={2}
              >
                {replyToMessage.content}
              </Text>
              <TextInput
                style={{
                  borderWidth: 1,
                  borderColor: '#E5E7EB',
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  marginBottom: 12,
                  minHeight: 40,
                  fontFamily: 'Nunito',
                }}
                placeholder="Type your reply..."
                value={replyText}
                onChangeText={setReplyText}
                multiline
                maxLength={500}
                autoFocus
              />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
                <TouchableOpacity
                  onPress={() => setReplyModalVisible(false)}
                  style={{ marginRight: 16 }}
                >
                  <Text style={{ fontFamily: 'Nunito', color: '#FF8C69', fontWeight: 'bold' }}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSendTextReply}
                  disabled={!replyText.trim()}
                  style={{ opacity: replyText.trim() ? 1 : 0.5 }}
                >
                  <Text style={{ fontFamily: 'Nunito', color: '#FF8C69', fontWeight: 'bold' }}>
                    Send
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}
