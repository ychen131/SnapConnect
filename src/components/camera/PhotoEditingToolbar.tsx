/**
 * @file PhotoEditingToolbar.tsx
 * @description Horizontal scrollable toolbar for photo editing tools including filters, text overlays, and other editing features.
 */
import React from 'react';
import { View, ScrollView, TouchableOpacity, Text, Dimensions } from 'react-native';

const { width: screenWidth } = Dimensions.get('window');

interface PhotoEditingToolbarProps {
  isVisible: boolean;
  onFilterPress?: () => void;
  onTextPress?: () => void;
  onUndoPress?: () => void;
  onRedoPress?: () => void;
  onResetPress?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  hasEdits?: boolean;
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
  canUndo = false,
  canRedo = false,
  hasEdits = false,
}: PhotoEditingToolbarProps) {
  if (!isVisible) {
    return null;
  }

  return (
    <View className="absolute bottom-24 left-0 right-0 bg-black/80 px-4 py-3">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 8,
          gap: 12,
        }}
        className="flex-row"
      >
        {/* Filters Button */}
        <TouchableOpacity
          className="items-center justify-center rounded-full bg-white/20 px-4 py-3"
          onPress={onFilterPress}
          activeOpacity={0.7}
        >
          <Text className="text-2xl">🎨</Text>
          <Text className="mt-1 text-xs font-medium text-white">Filters</Text>
        </TouchableOpacity>

        {/* Text Overlay Button */}
        <TouchableOpacity
          className="items-center justify-center rounded-full bg-white/20 px-4 py-3"
          onPress={onTextPress}
          activeOpacity={0.7}
        >
          <Text className="text-2xl">📝</Text>
          <Text className="mt-1 text-xs font-medium text-white">Text</Text>
        </TouchableOpacity>

        {/* Undo Button */}
        <TouchableOpacity
          className={`items-center justify-center rounded-full px-4 py-3 ${
            canUndo ? 'bg-white/20' : 'bg-white/10'
          }`}
          onPress={onUndoPress}
          disabled={!canUndo}
          activeOpacity={0.7}
        >
          <Text className={`text-2xl ${canUndo ? 'text-white' : 'text-white/50'}`}>↶</Text>
          <Text className={`mt-1 text-xs font-medium ${canUndo ? 'text-white' : 'text-white/50'}`}>
            Undo
          </Text>
        </TouchableOpacity>

        {/* Redo Button */}
        <TouchableOpacity
          className={`items-center justify-center rounded-full px-4 py-3 ${
            canRedo ? 'bg-white/20' : 'bg-white/10'
          }`}
          onPress={onRedoPress}
          disabled={!canRedo}
          activeOpacity={0.7}
        >
          <Text className={`text-2xl ${canRedo ? 'text-white' : 'text-white/50'}`}>↷</Text>
          <Text className={`mt-1 text-xs font-medium ${canRedo ? 'text-white' : 'text-white/50'}`}>
            Redo
          </Text>
        </TouchableOpacity>

        {/* Reset Button */}
        <TouchableOpacity
          className={`items-center justify-center rounded-full px-4 py-3 ${
            hasEdits ? 'bg-red-500/80' : 'bg-white/10'
          }`}
          onPress={onResetPress}
          disabled={!hasEdits}
          activeOpacity={0.7}
        >
          <Text className={`text-2xl ${hasEdits ? 'text-white' : 'text-white/50'}`}>🔄</Text>
          <Text className={`mt-1 text-xs font-medium ${hasEdits ? 'text-white' : 'text-white/50'}`}>
            Reset
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
