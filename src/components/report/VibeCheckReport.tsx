/**
 * @file VibeCheckReport.tsx
 * @description Bottom sheet/modal for displaying the detailed Vibe Check markdown report.
 */
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  ScrollView,
  Dimensions,
  Share,
  Platform,
  Alert,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

/**
 * Props for VibeCheckReport
 * @param visible Whether the modal is visible
 * @param onClose Callback to close the modal
 * @param report The detailed markdown report
 * @param photoUri (optional) The user's photo to display at the top
 */
interface VibeCheckReportProps {
  visible: boolean;
  onClose: () => void;
  report: string;
  photoUri?: string;
}

/**
 * Preprocesses markdown content to improve rendering
 * @param markdown The raw markdown content
 * @returns Processed markdown content
 */
function preprocessMarkdown(markdown: string): string {
  return (
    markdown
      // Convert <br> tags to line breaks
      .replace(/<br>/gi, '\n\n')
  );
}

/**
 * Bottom sheet/modal for displaying the detailed Vibe Check markdown report
 */
export default function VibeCheckReport({
  visible,
  onClose,
  report,
  photoUri,
}: VibeCheckReportProps) {
  const [isPhotoModalVisible, setPhotoModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const screen = Dimensions.get('window');

  // Download photo handler
  async function handleDownload() {
    if (!photoUri) return;
    try {
      setIsSaving(true);
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission required', 'Please allow photo access to save images.');
        setIsSaving(false);
        return;
      }
      const asset = await MediaLibrary.createAssetAsync(photoUri);
      await MediaLibrary.createAlbumAsync('VibeCheck', asset, false);
      Alert.alert('Saved!', 'Photo saved to your gallery.');
    } catch (error) {
      Alert.alert('Error', 'Could not save photo.');
    } finally {
      setIsSaving(false);
    }
  }

  // Share handler
  async function handleShare() {
    try {
      if (photoUri) {
        await Share.share({
          url: photoUri,
          message: `🐾 Vibe Check Report\n\n${report}`,
          title: 'Vibe Check Report',
        });
      } else {
        await Share.share({
          message: `🐾 Vibe Check Report\n\n${report}`,
          title: 'Vibe Check Report',
        });
      }
    } catch (error) {
      Alert.alert('Error', 'Could not share report.');
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>

          {/* Photo at top (optional, tappable) */}
          {photoUri && (
            <TouchableOpacity onPress={() => setPhotoModalVisible(true)} activeOpacity={0.8}>
              <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
            </TouchableOpacity>
          )}

          {/* Download & Share Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleDownload}
              disabled={isSaving}
            >
              <Text style={styles.actionButtonText}>{isSaving ? 'Saving...' : 'Download'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
              <Text style={styles.actionButtonText}>Share</Text>
            </TouchableOpacity>
          </View>

          {/* Markdown Report */}
          <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 32 }}>
            <Markdown style={markdownStyles}>{preprocessMarkdown(report)}</Markdown>
          </ScrollView>
        </View>

        {/* Fullscreen Photo Modal */}
        <Modal
          visible={isPhotoModalVisible}
          animationType="fade"
          transparent
          onRequestClose={() => setPhotoModalVisible(false)}
        >
          <View style={styles.fullscreenOverlay}>
            <Image
              source={{ uri: photoUri }}
              style={{
                width: screen.width,
                height: screen.height,
                resizeMode: 'contain',
                backgroundColor: 'black',
              }}
            />
            <TouchableOpacity
              style={styles.fullscreenCloseButton}
              onPress={() => setPhotoModalVisible(false)}
            >
              <Text style={styles.fullscreenCloseText}>✕</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    minHeight: '60%',
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 12,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 16,
    zIndex: 10,
    backgroundColor: '#eee',
    borderRadius: 16,
    padding: 4,
  },
  closeText: {
    fontSize: 20,
    color: '#333',
    fontWeight: 'bold',
  },
  photo: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: '#eee',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    gap: 16,
  },
  actionButton: {
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 20,
    marginHorizontal: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  actionButtonText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 16,
  },
  scroll: {
    marginTop: 32,
  },
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: 'black',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenCloseButton: {
    position: 'absolute',
    top: 40,
    right: 24,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 20,
    padding: 8,
    zIndex: 10,
  },
  fullscreenCloseText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
});

const markdownStyles = {
  heading1: { fontSize: 22, fontWeight: 700 as const, color: '#222', marginBottom: 8 },
  heading2: { fontSize: 18, fontWeight: 600 as const, color: '#444', marginBottom: 6 },
  paragraph: { fontSize: 16, color: '#333', marginBottom: 8 },
  list_item: { fontSize: 16, color: '#333' },
  strong: { fontWeight: 700 as const },
  em: { fontStyle: 'italic' as 'italic' },
  code_inline: { backgroundColor: '#f5f5f5', borderRadius: 4, padding: 2 },
};
