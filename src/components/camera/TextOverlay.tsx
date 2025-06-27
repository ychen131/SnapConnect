/**
 * @file TextOverlay.tsx
 * @description Draggable text overlay component for photo editing
 */
import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import type { TextOverlay as TextOverlayType } from '../../utils/imageFilters';

interface TextOverlayProps {
  overlay: TextOverlayType;
  onPositionChange: (id: string, x: number, y: number) => void;
  onPress: (id: string) => void;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

/**
 * Text overlay component (simplified version without gesture handling)
 * TODO: Add gesture handling when react-native-gesture-handler is available
 */
export default function TextOverlay({
  overlay,
  onPositionChange,
  onPress,
  isSelected,
  onSelect,
  onDelete,
}: TextOverlayProps) {
  const handlePress = () => {
    onSelect(overlay.id);
    onPress(overlay.id);
  };

  const handleDelete = () => {
    onDelete(overlay.id);
  };

  return (
    <View
      style={{
        position: 'absolute',
        left: overlay.x,
        top: overlay.y,
        zIndex: isSelected ? 1000 : 100,
      }}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        style={{
          padding: 4,
          borderRadius: 4,
          backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.2)' : 'transparent',
          borderWidth: isSelected ? 2 : 0,
          borderColor: isSelected ? '#007AFF' : 'transparent',
        }}
      >
        <Text
          style={{
            fontSize: overlay.fontSize,
            color: overlay.color,
            fontFamily: overlay.fontFamily,
            textShadowColor: 'rgba(0, 0, 0, 0.8)',
            textShadowOffset: { width: 1, height: 1 },
            textShadowRadius: 2,
            fontWeight: 'bold',
          }}
        >
          {overlay.text}
        </Text>

        {/* Delete button - only show when selected */}
        {isSelected && (
          <TouchableOpacity
            onPress={handleDelete}
            style={{
              position: 'absolute',
              top: -8,
              right: -8,
              width: 20,
              height: 20,
              borderRadius: 10,
              backgroundColor: '#FF3B30',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: 'white', fontSize: 12, fontWeight: 'bold' }}>×</Text>
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </View>
  );
}
