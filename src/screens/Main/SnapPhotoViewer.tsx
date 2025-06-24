/**
 * @file SnapPhotoViewer.tsx
 * @description Full-screen viewer for photo snaps with countdown timer and auto-dismiss.
 */
import React, { useEffect, useState } from 'react';
import { View, Image, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { markMessagesAsViewed } from '../../services/chatService';

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

  // Debug log for photoUrl
  console.log('🖼️ SnapPhotoViewer photoUrl:', photoUrl);

  useEffect(() => {
    // Start countdown
    if (secondsLeft <= 0) {
      handleClose();
      return;
    }
    const interval = setInterval(() => {
      setSecondsLeft((s) => s - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  async function handleClose() {
    // Mark as viewed
    await markMessagesAsViewed(conversationId, userId);
    navigation.goBack();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'black' }}>
      <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={handleClose}>
        <Image
          source={{ uri: photoUrl }}
          style={{ flex: 1, resizeMode: 'contain', backgroundColor: 'black' }}
        />
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
          <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>{secondsLeft}s</Text>
        </View>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
