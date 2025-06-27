/**
 * @file TextOverlay.tsx
 * @description Draggable text overlay component for photo editing
 */
import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Gesture, GestureDetector, GestureType } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import type { TextOverlay as TextOverlayType } from '../../utils/imageFilters';

interface TextOverlayProps {
  overlay: TextOverlayType;
  onPositionChange: (id: string, x: number, y: number) => void;
  onPress: (id: string) => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  isSelected: boolean;
  isEditMode: boolean;
}

/**
 * Draggable text overlay component
 */
export default function TextOverlay({
  overlay,
  onPositionChange,
  onPress,
  onSelect,
  onDelete,
  isSelected,
  isEditMode,
}: TextOverlayProps) {
  const translateX = useSharedValue(overlay.x);
  const translateY = useSharedValue(overlay.y);
  const scale = useSharedValue(1);
  const [isDragging, setIsDragging] = useState(false);

  // Update position when overlay changes
  React.useEffect(() => {
    translateX.value = overlay.x;
    translateY.value = overlay.y;
  }, [overlay.x, overlay.y]);

  const panGesture = Gesture.Pan()
    .onStart(() => {
      runOnJS(setIsDragging)(true);
      runOnJS(onSelect)(overlay.id);
    })
    .onUpdate((event) => {
      translateX.value = event.translationX + overlay.x;
      translateY.value = event.translationY + overlay.y;
    })
    .onEnd(() => {
      runOnJS(setIsDragging)(false);
      runOnJS(onPositionChange)(overlay.id, translateX.value, translateY.value);
    });

  const tapGesture = Gesture.Tap().onStart(() => {
    runOnJS(onPress)(overlay.id);
  });

  const composed = Gesture.Simultaneous(panGesture, tapGesture);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { scale: withSpring(scale.value) },
      ],
    };
  });

  const containerStyle = useAnimatedStyle(() => {
    return {
      opacity: isDragging ? 0.8 : 1,
      zIndex: isDragging ? 1000 : 1,
    };
  });

  // Only attach gestures if in edit mode
  const dummyGesture = Gesture.Tap().onStart(() => {});
  const gestureToUse = isEditMode ? composed : dummyGesture;

  return (
    <GestureDetector gesture={gestureToUse}>
      <Animated.View
        style={[
          styles.container,
          containerStyle,
          { left: 0, top: 0 }, // Position will be controlled by translateX/Y
        ]}
      >
        <Animated.View style={[styles.textContainer, animatedStyle]}>
          <Text
            style={[
              styles.text,
              {
                fontSize: overlay.fontSize,
                color: overlay.color,
                fontFamily: overlay.fontFamily,
              },
            ]}
          >
            {overlay.text}
          </Text>

          {/* Selection indicator */}
          {isSelected && isEditMode && (
            <View style={styles.selectionBorder}>
              <View style={styles.cornerHandle} />
              <View style={[styles.cornerHandle, styles.topRight]} />
              <View style={[styles.cornerHandle, styles.bottomLeft]} />
              <View style={[styles.cornerHandle, styles.bottomRight]} />
            </View>
          )}

          {/* Delete button - only show when selected and in edit mode */}
          {isSelected && isEditMode && (
            <TouchableOpacity style={styles.deleteButton} onPress={() => onDelete(overlay.id)}>
              <Text style={styles.deleteButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  textContainer: {
    position: 'absolute',
    padding: 8,
    minWidth: 40,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    textAlign: 'center',
  },
  selectionBorder: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderStyle: 'dashed',
    borderRadius: 4,
  },
  cornerHandle: {
    position: 'absolute',
    width: 8,
    height: 8,
    backgroundColor: '#007AFF',
    borderRadius: 4,
    top: -4,
    left: -4,
  },
  topRight: {
    top: -4,
    right: -4,
    left: 'auto',
  },
  bottomLeft: {
    bottom: -4,
    left: -4,
    top: 'auto',
  },
  bottomRight: {
    bottom: -4,
    right: -4,
    top: 'auto',
    left: 'auto',
  },
  deleteButton: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 24,
    height: 24,
    backgroundColor: '#FF3B30',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
});
