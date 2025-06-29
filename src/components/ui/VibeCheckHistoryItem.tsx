/**
 * @file VibeCheckHistoryItem.tsx
 * @description Component for displaying individual Vibe Check history items in a grid.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import CachedImage from './CachedImage';

/**
 * Props for VibeCheckHistoryItem
 * @param photoUri The URI of the photo used for the Vibe Check
 * @param summary The short summary (vibe) from the Magic Sticker
 * @param timestamp When the Vibe Check was performed
 * @param onPress Callback when the item is tapped (to show full report)
 * @param getRelativeTime Optional function to get a relative time from a timestamp
 */
interface VibeCheckHistoryItemProps {
  photoUri: string;
  summary: string;
  timestamp: string;
  onPress: () => void;
  getRelativeTime?: (timestamp: string) => string;
}

/**
 * Individual Vibe Check history item for the grid
 */
const VibeCheckHistoryItem = React.memo(function VibeCheckHistoryItem({
  photoUri,
  summary,
  timestamp,
  onPress,
  getRelativeTime,
}: VibeCheckHistoryItemProps) {
  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      {/* Photo Thumbnail */}
      <View style={styles.photoContainer}>
        <CachedImage
          uri={photoUri}
          style={styles.photo}
          fallbackSource={require('../../../assets/icon.png')}
          showLoadingIndicator={false}
        />

        {/* Magic Sticker Overlay */}
        <View style={styles.stickerOverlay}>
          <View style={styles.sticker}>
            <Text style={styles.sparkle}>✨</Text>
            <Text style={styles.summaryText} numberOfLines={2}>
              {summary}
            </Text>
          </View>
        </View>
      </View>

      {/* Relative Timestamp */}
      <Text style={styles.timestamp}>
        {getRelativeTime ? getRelativeTime(timestamp) : timestamp}
      </Text>
    </TouchableOpacity>
  );
});

export default VibeCheckHistoryItem;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 4,
    borderRadius: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  photoContainer: {
    position: 'relative',
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  stickerOverlay: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    right: 8,
    alignItems: 'center',
  },
  sticker: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 2,
    borderColor: '#FFD700',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  sparkle: {
    fontSize: 12,
    marginBottom: 2,
  },
  summaryText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    lineHeight: 12,
  },
  timestamp: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 6,
    marginBottom: 8,
  },
});
