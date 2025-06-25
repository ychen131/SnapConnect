/**
 * @file ReplyInputModal.tsx
 * @description Modal component for inputting text replies to snaps.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ReplyInputModalProps {
  visible: boolean;
  onClose: () => void;
  onSend: (replyText: string) => void;
  originalMessageId: string;
  originalMessageType: 'photo' | 'video';
}

/**
 * Modal for inputting text replies to snaps
 */
export default function ReplyInputModal({
  visible,
  onClose,
  onSend,
  originalMessageId,
  originalMessageType,
}: ReplyInputModalProps) {
  const [replyText, setReplyText] = useState('');

  /**
   * Handles sending the reply
   */
  function handleSend() {
    if (replyText.trim()) {
      onSend(replyText.trim());
      setReplyText('');
    }
  }

  /**
   * Handles closing the modal
   */
  function handleClose() {
    setReplyText('');
    onClose();
  }

  /**
   * Handles keyboard submit
   */
  function handleSubmitEditing() {
    handleSend();
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 16,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: '#E5E7EB',
            }}
          >
            <TouchableOpacity onPress={handleClose}>
              <Text style={{ fontSize: 16, color: '#3B82F6' }}>Cancel</Text>
            </TouchableOpacity>

            <Text style={{ fontSize: 18, fontWeight: '600', color: '#1F2937' }}>
              Reply to {originalMessageType === 'photo' ? 'Photo' : 'Video'}
            </Text>

            <TouchableOpacity
              onPress={handleSend}
              disabled={!replyText.trim()}
              style={{
                opacity: replyText.trim() ? 1 : 0.5,
              }}
            >
              <Text
                style={{
                  fontSize: 16,
                  fontWeight: '600',
                  color: replyText.trim() ? '#3B82F6' : '#9CA3AF',
                }}
              >
                Send
              </Text>
            </TouchableOpacity>
          </View>

          {/* Reply Input */}
          <View style={{ flex: 1, padding: 16 }}>
            <View
              style={{
                backgroundColor: '#F9FAFB',
                borderRadius: 12,
                padding: 16,
                marginBottom: 16,
              }}
            >
              <Text style={{ fontSize: 14, color: '#6B7280', marginBottom: 8 }}>
                Replying to {originalMessageType === 'photo' ? '📸 Photo' : '🎬 Video'}
              </Text>
              <Text style={{ fontSize: 12, color: '#9CA3AF' }}>
                Message ID: {originalMessageId}
              </Text>
            </View>

            <TextInput
              style={{
                flex: 1,
                fontSize: 16,
                color: '#1F2937',
                textAlignVertical: 'top',
                padding: 16,
                backgroundColor: '#F9FAFB',
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#E5E7EB',
              }}
              placeholder="Type your reply..."
              placeholderTextColor="#9CA3AF"
              value={replyText}
              onChangeText={setReplyText}
              multiline
              autoFocus
              maxLength={500}
              onSubmitEditing={handleSubmitEditing}
              returnKeyType="send"
            />

            {/* Character Count */}
            <View style={{ alignItems: 'flex-end', marginTop: 8 }}>
              <Text style={{ fontSize: 12, color: '#9CA3AF' }}>{replyText.length}/500</Text>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}
