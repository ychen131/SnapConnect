/**
 * @file SnapPhotoViewer.tsx
 * @description Full-screen viewer for photo snaps with countdown timer and auto-dismiss.
 */
import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { markMessagesAsViewed } from '../../services/chatService';
import { sendTextReply } from '../../services/chatService';
import { clearSnapNotification, clearMessageNotification } from '../../services/realtimeService';
import { supabase } from '../../services/supabase';
import ReplyInputModal from '../../components/ui/ReplyInputModal';
import CachedImage from '../../components/ui/CachedImage';

interface SnapPhotoViewerProps {
  navigation: any;
  route: {
    params: {
      messageId: string;
      photoUrl: string;
      timer: number;
      conversationId: string;
      userId: string;
    };
  };
}

/**
 * Displays a photo snap with a countdown timer and auto-dismiss
 */
export default function SnapPhotoViewer({ navigation, route }: SnapPhotoViewerProps) {
  const { messageId, photoUrl, timer, conversationId, userId } = route.params;
  const [secondsLeft, setSecondsLeft] = useState(timer || 3);
  const [showReplyModal, setShowReplyModal] = useState(false);

  // Debug log for photoUrl
  console.log('🖼️ SnapPhotoViewer photoUrl:', photoUrl);

  useEffect(() => {
    // Clear the snap notification when the snap is viewed
    clearSnapNotification(messageId);
    console.log('✅ Cleared snap notification for message:', messageId);

    // Also clear message notifications for this conversation since user is viewing it
    clearMessageNotification(conversationId);
    console.log('✅ Cleared message notifications for conversation:', conversationId);

    // Start countdown
    if (secondsLeft <= 0) {
      handleClose();
      return;
    }
    const interval = setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft, messageId, conversationId]);

  async function handleClose() {
    // Mark as viewed
    await markMessagesAsViewed(conversationId, userId);
    navigation.goBack();
  }

  /**
   * Handles reply button press
   */
  function handleReply() {
    console.log('💬 Reply button pressed for message:', messageId);
    setShowReplyModal(true);
  }

  /**
   * Handles sending a text reply
   */
  async function handleSendReply(replyText: string) {
    console.log('📤 Sending reply:', replyText, 'to message:', messageId);

    try {
      // For replies, we need to send to the original message sender
      // Since we're viewing their snap, we reply to them
      const { data: originalMessage } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('id', messageId)
        .single();

      if (!originalMessage) {
        throw new Error('Original message not found');
      }

      await sendTextReply(conversationId, userId, originalMessage.sender_id, replyText, messageId);

      setShowReplyModal(false);
      console.log('✅ Reply sent successfully');
    } catch (error) {
      console.error('❌ Error sending reply:', error);
      // TODO: Show error message to user
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
      <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleClose}>
        <CachedImage
          uri={photoUrl}
          style={{ flex: 1, resizeMode: 'contain', backgroundColor: 'black' }}
          fallbackSource={require('../../../assets/icon.png')}
          showLoadingIndicator={true}
          loadingColor="#FFFFFF"
          loadingSize="large"
        />

        {/* Timer Display */}
        <View
          style={{
            position: 'absolute',
            top: 40,
            alignSelf: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 6,
          }}
        >
          <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold', fontFamily: 'Nunito' }}>
            {secondsLeft}s
          </Text>
        </View>

        {/* Reply Button */}
        <TouchableOpacity
          style={{
            position: 'absolute',
            bottom: 40,
            right: 20,
            backgroundColor: 'rgba(0,0,0,0.7)',
            borderRadius: 25,
            width: 50,
            height: 50,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          onPress={handleReply}
          activeOpacity={0.8}
        >
          <Text style={{ color: 'white', fontSize: 20, fontFamily: 'Nunito' }}>💬</Text>
        </TouchableOpacity>
      </TouchableOpacity>

      {/* Reply Input Modal */}
      <ReplyInputModal
        visible={showReplyModal}
        onClose={() => setShowReplyModal(false)}
        onSend={handleSendReply}
        originalMessageId={messageId}
        originalMessageType="photo"
      />
    </SafeAreaView>
  );
}
