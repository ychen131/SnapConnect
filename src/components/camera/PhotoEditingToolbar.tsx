/**
 * @file PhotoEditingToolbar.tsx
 * @description Horizontal scrollable toolbar for photo editing tools including filters, text overlays, and other editing features.
 */
import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, Dimensions, StyleSheet } from 'react-native';
import FilterCarousel from './FilterCarousel';
import type { FilterType } from '../../utils/imageFilters';

const { width: screenWidth } = Dimensions.get('window');

interface PhotoEditingToolbarProps {
  isVisible: boolean;
  onFilterPress: () => void;
  onTextPress: () => void;
  onUndoPress: () => void;
  onRedoPress: () => void;
  onResetPress: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasEdits: boolean;
  // Filter-related props
  selectedFilter: FilterType;
  onFilterSelect: (filter: FilterType) => void;
  imageUri?: string;
}

/**
 * Photo editing toolbar with horizontal scrollable layout
 * Contains buttons for filters, text overlays, undo/redo, and reset
 */
export default function PhotoEditingToolbar({
  isVisible,
  onFilterPress,
  onTextPress,
  onUndoPress,
  onRedoPress,
  onResetPress,
  canUndo,
  canRedo,
  hasEdits,
  selectedFilter,
  onFilterSelect,
  imageUri,
}: PhotoEditingToolbarProps) {
  if (!isVisible) {
    return null;
  }

  const availableFilters: FilterType[] = [
    'original',
    'bw',
    'sepia',
    'vibrant',
    'cool',
    'warm',
    'invert',
    'contrast',
    'vintage',
    'night',
  ];

  return (
    <View style={styles.container} pointerEvents="box-none">
      {/* Filter Carousel */}
      <FilterCarousel
        filters={availableFilters}
        selectedFilter={selectedFilter}
        onFilterSelect={onFilterSelect}
        imageUri={imageUri}
      />

      {/* Editing Tools */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.toolsContainer}
        pointerEvents="box-none"
      >
        {/* Undo Button */}
        <TouchableOpacity
          style={[styles.toolButton, !canUndo && styles.disabledButton]}
          onPress={onUndoPress}
          disabled={!canUndo}
        >
          <Text style={[styles.toolIcon, !canUndo && styles.disabledIcon]}>↶</Text>
          <Text style={[styles.toolLabel, !canUndo && styles.disabledIcon]}>Undo</Text>
        </TouchableOpacity>

        {/* Redo Button */}
        <TouchableOpacity
          style={[styles.toolButton, !canRedo && styles.disabledButton]}
          onPress={onRedoPress}
          disabled={!canRedo}
        >
          <Text style={[styles.toolIcon, !canRedo && styles.disabledIcon]}>↷</Text>
          <Text style={[styles.toolLabel, !canRedo && styles.disabledIcon]}>Redo</Text>
        </TouchableOpacity>

        {/* Text Button */}
        <TouchableOpacity style={styles.toolButton} onPress={onTextPress}>
          <Text style={styles.toolIcon}>T</Text>
          <Text style={styles.toolLabel}>Text</Text>
        </TouchableOpacity>

        {/* Reset Button */}
        <TouchableOpacity
          style={[styles.toolButton, !hasEdits && styles.disabledButton]}
          onPress={onResetPress}
          disabled={!hasEdits}
        >
          <Text style={[styles.toolIcon, !hasEdits && styles.disabledIcon]}>↺</Text>
          <Text style={[styles.toolLabel, !hasEdits && styles.disabledIcon]}>Reset</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 24,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 4,
    paddingBottom: 3,
    zIndex: 9999,
  },
  toolsContainer: {
    paddingHorizontal: 8,
    gap: 12,
  },
  toolButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    paddingHorizontal: 8,
    borderRadius: 999,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    zIndex: 10000,
  },
  disabledButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  toolIcon: {
    fontSize: 24,
    color: 'white',
  },
  disabledIcon: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  toolLabel: {
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '500',
    color: 'white',
  },
});
