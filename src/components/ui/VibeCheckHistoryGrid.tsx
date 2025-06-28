/**
 * @file VibeCheckHistoryGrid.tsx
 * @description Grid component for displaying Vibe Check history items in a 3-column layout.
 */
import React from 'react';
import { View, FlatList, StyleSheet, Text } from 'react-native';
import VibeCheckHistoryItem from './VibeCheckHistoryItem';

/**
 * Interface for a Vibe Check history item
 */
export interface VibeCheckHistoryItem {
  id: string;
  photoUri: string;
  summary: string;
  detailedReport: string;
  timestamp: string;
}

/**
 * Props for VibeCheckHistoryGrid
 * @param items Array of Vibe Check history items to display
 * @param onItemPress Callback when a history item is tapped
 * @param getRelativeTime Optional function to get relative time
 */
interface VibeCheckHistoryGridProps {
  items: VibeCheckHistoryItem[];
  onItemPress: (item: VibeCheckHistoryItem) => void;
  getRelativeTime?: (timestamp: string) => string;
}

/**
 * Grid component for displaying Vibe Check history
 */
export default function VibeCheckHistoryGrid({
  items,
  onItemPress,
  getRelativeTime,
}: VibeCheckHistoryGridProps) {
  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🐾✨</Text>
        <Text style={styles.emptyTitle}>No Vibe Checks Yet</Text>
        <Text style={styles.emptySubtitle}>
          Take a photo and use the Vibe Check feature to see your pup's magic stickers here!
        </Text>
      </View>
    );
  }

  const renderItem = ({ item }: { item: VibeCheckHistoryItem }) => (
    <VibeCheckHistoryItem
      photoUri={item.photoUri}
      summary={item.summary}
      timestamp={item.timestamp}
      onPress={() => onItemPress(item)}
      getRelativeTime={getRelativeTime}
    />
  );

  return (
    <FlatList
      data={items}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      numColumns={3}
      columnWrapperStyle={styles.row}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  row: {
    justifyContent: 'space-between',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});
