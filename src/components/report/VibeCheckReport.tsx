/**
 * @file VibeCheckReport.tsx
 * @description Bottom sheet/modal for displaying the detailed Vibe Check markdown report.
 */
import React from 'react';
import { Modal, View, Text, TouchableOpacity, Image, StyleSheet, ScrollView } from 'react-native';
import Markdown from 'react-native-markdown-display';

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
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Close Button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>

          {/* Photo at top (optional) */}
          {photoUri && <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />}

          {/* Markdown Report */}
          <ScrollView style={styles.scroll} contentContainerStyle={{ paddingBottom: 32 }}>
            <Markdown style={markdownStyles}>{preprocessMarkdown(report)}</Markdown>
          </ScrollView>
        </View>
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
  scroll: {
    marginTop: 32,
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
