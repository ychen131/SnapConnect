/**
 * @file SnapVideoViewer.tsx
 * @description Full-screen viewer for video snaps with progress tracking and auto-dismiss.
 */
import React, { useEffect, useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Video, ResizeMode, AVPlaybackStatus } from 'expo-av';
import { markMessagesAsViewed } from '../../services/chatService';
import { sendTextReply } from '../../services/chatService';
import { clearSnapNotification, clearMessageNotification } from '../../services/realtimeService';
import { supabase } from '../../services/supabase';
import ReplyInputModal from '../../components/ui/ReplyInputModal';

interface SnapVideoViewerProps {
  navigation: any;
  route: {
    params: {
      messageId: string;
      videoUrl: string;
      conversationId: string;
      userId: string;
    };
  };
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

/**
 * Displays a video snap with progress tracking and auto-dismiss
 */
export default function SnapVideoViewer({ navigation, route }: SnapVideoViewerProps) {
  const { messageId, videoUrl, conversationId, userId } = route.params;
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReplyModal, setShowReplyModal] = useState(false);

  const videoRef = useRef<Video>(null);

  // Debug log for videoUrl
  console.log('🎬 SnapVideoViewer videoUrl:', videoUrl);

  useEffect(() => {
    // Clear the snap notification when the video snap is viewed
    clearSnapNotification(messageId);
    console.log('✅ Cleared snap notification for message:', messageId);

    // Also clear message notifications for this conversation since user is viewing it
    clearMessageNotification(conversationId);
    console.log('✅ Cleared message notifications for conversation:', conversationId);

    // Auto-play when component mounts
    if (videoRef.current) {
      videoRef.current.playAsync();
    }
  }, [messageId, conversationId]);

  /**
   * Handles video playback status updates
   */
  function handlePlaybackStatusUpdate(status: AVPlaybackStatus) {
    if (!status.isLoaded) {
      if (status.error) {
        console.error('❌ Video playback error:', status.error);
        setError('Failed to load video');
      }
      return;
    }

    setIsLoading(false);
    setIsPlaying(status.isPlaying);
    setProgress(status.positionMillis);
    setDuration(status.durationMillis || 0);

    // Auto-dismiss when video finishes
    if (status.didJustFinish) {
      console.log('✅ Video finished, auto-dismissing');
      handleClose();
    }
  }

  /**
   * Handles closing the video viewer
   */
  async function handleClose() {
    try {
      // Mark as viewed
      await markMessagesAsViewed(conversationId, userId);
    } catch (error) {
      console.error('Error marking video as viewed:', error);
    }

    // Stop video playback
    if (videoRef.current) {
      videoRef.current.stopAsync();
    }

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

  /**
   * Handles video loading errors
   */
  function handleLoadError(error: string) {
    console.error('❌ Video load error:', error);
    setError('Failed to load video');
    setIsLoading(false);
  }

  /**
   * Calculates progress percentage
   */
  const progressPercentage = duration > 0 ? (progress / duration) * 100 : 0;

  /**
   * Formats time in seconds
   */
  function formatTime(milliseconds: number): string {
    const seconds = Math.floor(milliseconds / 1000);
    return `${seconds}s`;
  }

  if (error) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: 'white', fontSize: 18, marginBottom: 20, fontFamily: 'Nunito' }}>
            {error}
          </Text>
          <TouchableOpacity
            style={{
              backgroundColor: 'rgba(255,255,255,0.2)',
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 20,
            }}
            onPress={handleClose}
          >
            <Text style={{ color: 'white', fontSize: 16, fontFamily: 'Nunito' }}>Close</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
      <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleClose}>
        {/* Video Player */}
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Video
            ref={videoRef}
            source={{ uri: videoUrl }}
            style={{
              width: screenWidth,
              height: screenHeight * 0.8,
              backgroundColor: 'black',
            }}
            resizeMode={ResizeMode.CONTAIN}
            shouldPlay={true}
            isLooping={false}
            isMuted={false}
            onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
            onError={handleLoadError}
          />
        </View>

        {/* Loading Indicator */}
        {isLoading && (
          <View
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: [{ translateX: -20 }, { translateY: -20 }],
            }}
          >
            <Text style={{ color: 'white', fontSize: 16, fontFamily: 'Nunito' }}>Loading...</Text>
          </View>
        )}

        {/* Progress Bar */}
        {!isLoading && duration > 0 && (
          <View
            style={{
              position: 'absolute',
              bottom: 100,
              left: 20,
              right: 20,
              height: 4,
              backgroundColor: 'rgba(255,255,255,0.3)',
              borderRadius: 2,
            }}
          >
            <View
              style={{
                width: `${progressPercentage}%`,
                height: '100%',
                backgroundColor: '#FF8C69',
                borderRadius: 2,
              }}
            />
          </View>
        )}

        {/* Time Display */}
        {!isLoading && duration > 0 && (
          <View
            style={{
              position: 'absolute',
              bottom: 120,
              alignSelf: 'center',
              backgroundColor: 'rgba(0,0,0,0.5)',
              borderRadius: 20,
              paddingHorizontal: 16,
              paddingVertical: 6,
            }}
          >
            <Text style={{ color: 'white', fontSize: 16, fontFamily: 'Nunito' }}>
              {formatTime(progress)} / {formatTime(duration)}
            </Text>
          </View>
        )}

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

        {/* Play/Pause Indicator */}
        {!isLoading && (
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
            <Text style={{ color: 'white', fontSize: 16, fontFamily: 'Nunito' }}>
              {isPlaying ? '▶️' : '⏸️'}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* Reply Input Modal */}
      <ReplyInputModal
        visible={showReplyModal}
        onClose={() => setShowReplyModal(false)}
        onSend={handleSendReply}
        originalMessageId={messageId}
        originalMessageType="video"
      />
    </SafeAreaView>
  );
}
