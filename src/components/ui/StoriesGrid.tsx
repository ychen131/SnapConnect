/**
 * @file StoriesGrid.tsx
 * @description 3-column grid component for displaying user stories on the profile page (no FlatList).
 */
import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import CachedImage from './CachedImage';

export interface Story {
  id: string;
  media_url: string;
}

export interface StoriesGridProps {
  stories: Story[];
  onStoryPress?: (story: Story) => void;
}

/**
 * 3-column grid for displaying user stories (no FlatList)
 */
export function StoriesGrid({ stories, onStoryPress }: StoriesGridProps) {
  // Helper to chunk array into rows of 3
  function chunk<T>(arr: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) =>
      arr.slice(i * size, i * size + size),
    );
  }

  const gridData =
    stories && stories.length > 0 ? chunk(stories, 3) : chunk(Array(6).fill(null), 3);

  return (
    <View className="w-full">
      {gridData.map((row, rowIdx) => (
        <View key={rowIdx} className="mb-1 flex-row gap-1">
          {row.map((item, colIdx) =>
            item ? (
              <TouchableOpacity
                key={item.id}
                className="aspect-square flex-1"
                onPress={onStoryPress ? () => onStoryPress(item) : undefined}
                disabled={!onStoryPress}
              >
                <CachedImage
                  uri={item.media_url}
                  style={{ width: '100%', height: '100%', borderRadius: 6 }}
                  fallbackSource={require('../../../assets/icon.png')}
                  showLoadingIndicator={false}
                />
              </TouchableOpacity>
            ) : (
              <View key={colIdx} className="aspect-square flex-1 rounded-md bg-gray-200" />
            ),
          )}
        </View>
      ))}
    </View>
  );
}

export default StoriesGrid;
