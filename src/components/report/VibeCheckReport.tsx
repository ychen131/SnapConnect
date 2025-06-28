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
  LayoutAnimation,
  UIManager,
  ActivityIndicator,
} from 'react-native';
import Markdown from 'react-native-markdown-display';
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';

// Enable LayoutAnimation on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/**
 * Props for VibeCheckReport
 * @param visible Whether the modal is visible
 * @param onClose Callback to close the modal
 * @param report The detailed markdown report
 * @param photoUri (optional) The user's photo to display at the top
 * @param isLoading (optional) Whether the report is still loading
 * @param onDelete (optional) Callback to delete the report
 * @param onSaveToProfile (optional) Callback to save the report to the user's profile
 */
interface VibeCheckReportProps {
  visible: boolean;
  onClose: () => void;
  report: string;
  photoUri?: string;
  isLoading?: boolean;
  onDelete?: () => void;
  onSaveToProfile?: () => void;
}

/**
 * Preprocesses markdown content to improve rendering
 * @param markdown The raw markdown content
 * @returns Processed markdown content
 */
function preprocessMarkdown(markdown: string): string {
  return (
    markdown
      // Insert a newline before every '###' header to ensure proper splitting
      .replace(/(?!^)### /g, '\n### ')
      // Convert <br> tags to line breaks
      .replace(/<br>/gi, '\n\n')
  );
}

/**
 * Splits the markdown report into sections by ### headers
 * Returns an array of { title, content }
 * Filters out unwanted sections.
 */
function splitMarkdownSections(markdown: string) {
  const lines = preprocessMarkdown(markdown).split('\n');
  const sections: { title: string; content: string }[] = [];
  let currentTitle = '';
  let currentContent: string[] = [];
  lines.forEach((line) => {
    if (line.match(/^### /)) {
      if (currentTitle) {
        sections.push({ title: currentTitle, content: currentContent.join('\n').trim() });
      }
      currentTitle = line.replace(/^### /, '').trim();
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  });
  if (currentTitle) {
    sections.push({ title: currentTitle, content: currentContent.join('\n').trim() });
  }
  // Filter out unwanted sections
  const hiddenTitles = ['Vibe Check Report', 'Behavioral Context', 'Comfort & Well-being Level'];
  return sections.filter(
    (section) =>
      !hiddenTitles.some((hidden) => section.title.toLowerCase() === hidden.toLowerCase()),
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
  isLoading = false,
  onDelete,
  onSaveToProfile,
}: VibeCheckReportProps) {
  const [isPhotoModalVisible, setPhotoModalVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const sections = splitMarkdownSections(report);
  // Find the index of 'Emotional State Assessment', default to 0
  const defaultExpanded = Math.max(
    0,
    sections.findIndex((s) => s.title.toLowerCase().includes('emotional state assessment')),
  );
  const [expandedSection, setExpandedSection] = useState(defaultExpanded);
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

  function handleToggleSection(idx: number) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSection(idx === expandedSection ? -1 : idx);
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

          {/* Download, Share, and Delete Buttons */}
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
            {/* Show Save to Profile if not already saved (i.e., if onDelete is not present) */}
            {!onDelete && onSaveToProfile && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: '#e0f7fa', borderColor: '#00bcd4' },
                ]}
                onPress={onSaveToProfile}
              >
                <Text style={[styles.actionButtonText, { color: '#00796b' }]}>Save to Profile</Text>
              </TouchableOpacity>
            )}
            {onDelete && (
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  { backgroundColor: '#ffdddd', borderColor: '#ff4444' },
                ]}
                onPress={onDelete}
              >
                <Text style={[styles.actionButtonText, { color: '#b00020' }]}>Delete</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Expandable Markdown Sections or Loading Spinner */}
          <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 32 }}>
            {isLoading && !report && (
              <View style={{ alignItems: 'center', marginTop: 32 }}>
                <ActivityIndicator size="large" color="#FFD700" />
                <Text style={{ marginTop: 16, color: '#bfa100', fontWeight: 'bold', fontSize: 16 }}>
                  Generating your Vibe Check report...
                </Text>
              </View>
            )}
            {!isLoading && !report && (
              <View style={{ alignItems: 'center', marginTop: 32 }}>
                <Text style={{ color: '#bfa100', fontWeight: 'bold', fontSize: 16 }}>
                  No report available.
                </Text>
              </View>
            )}
            {report &&
              !isLoading &&
              sections.map((section, idx) => (
                <View key={idx} style={styles.sectionContainer}>
                  <TouchableOpacity
                    style={styles.sectionHeader}
                    onPress={() => handleToggleSection(idx)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.sectionHeaderText}>
                      {section.title}
                      {expandedSection === idx ? ' ▼' : ' ▶'}
                    </Text>
                  </TouchableOpacity>
                  {expandedSection === idx && (
                    <View style={styles.sectionContent}>
                      <Markdown style={markdownStyles}>{section.content}</Markdown>
                    </View>
                  )}
                </View>
              ))}
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
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
    paddingHorizontal: 12,
  },
  actionButton: {
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
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
  sectionContainer: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: '#faf8f2',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#f3e7c9',
  },
  sectionHeader: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fffbe6',
    borderBottomWidth: 1,
    borderBottomColor: '#f3e7c9',
  },
  sectionHeaderText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#bfa100',
  },
  sectionContent: {
    padding: 16,
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
