/**
 * @file FilterCarousel.tsx
 * @description Horizontal scrollable carousel for photo filter selection
 */
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, StyleSheet } from 'react-native';
import type { FilterType } from '../../utils/imageFilters';
import { getFilterDisplayName, getFilterIcon } from '../../utils/imageFilters';

interface FilterCarouselProps {
  filters: FilterType[];
  selectedFilter: FilterType;
  onFilterSelect: (filter: FilterType) => void;
  imageUri?: string; // Optional preview image
}

/**
 * Horizontal scrollable carousel for filter selection
 */
export default function FilterCarousel({
  filters,
  selectedFilter,
  onFilterSelect,
  imageUri,
}: FilterCarouselProps) {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterItem, selectedFilter === filter && styles.selectedFilter]}
            onPress={() => onFilterSelect(filter)}
            activeOpacity={0.7}
          >
            {/* Filter Preview */}
            <View style={styles.previewContainer}>
              {imageUri ? (
                <Image
                  source={{ uri: imageUri }}
                  style={[styles.previewImage, selectedFilter === filter && styles.selectedPreview]}
                  resizeMode="cover"
                />
              ) : (
                <View
                  style={[styles.placeholder, selectedFilter === filter && styles.selectedPreview]}
                >
                  <Text style={styles.placeholderText}>📷</Text>
                </View>
              )}

              {/* Filter Overlay */}
              <View
                style={[styles.filterOverlay, selectedFilter === filter && styles.selectedOverlay]}
              >
                <Text style={styles.filterIcon}>{getFilterIcon(filter)}</Text>
              </View>
            </View>

            {/* Filter Name */}
            <Text
              style={[styles.filterName, selectedFilter === filter && styles.selectedFilterName]}
            >
              {getFilterDisplayName(filter)}
            </Text>

            {/* Selection Indicator */}
            {selectedFilter === filter && (
              <View style={styles.selectionIndicator}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 100,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  filterItem: {
    alignItems: 'center',
    marginRight: 16,
    minWidth: 60,
  },
  selectedFilter: {
    transform: [{ scale: 1.05 }],
  },
  previewContainer: {
    position: 'relative',
    width: 50,
    height: 50,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 4,
  },
  previewImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  selectedPreview: {
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#333',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 20,
  },
  filterOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedOverlay: {
    backgroundColor: 'rgba(0, 122, 255, 0.3)',
  },
  filterIcon: {
    fontSize: 16,
    color: 'white',
  },
  filterName: {
    fontSize: 10,
    color: '#CCC',
    textAlign: 'center',
    fontWeight: '500',
  },
  selectedFilterName: {
    color: '#007AFF',
    fontWeight: 'bold',
  },
  selectionIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  checkmark: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
