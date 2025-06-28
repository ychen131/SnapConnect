/**
 * @file VibeCheckSticker.tsx
 * @description Draggable, resizable sticker for displaying the Vibe Check short summary on a photo. Includes a 'Learn Why' button when selected.
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  PanGestureHandler,
  PinchGestureHandler,
  PanGestureHandlerGestureEvent,
  PinchGestureHandlerGestureEvent,
} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  useAnimatedGestureHandler,
} from 'react-native-reanimated';

/**
 * Props for VibeCheckSticker
 * @param summary The short summary (vibe) to display
 * @param onLearnWhy Callback when 'Learn Why' is pressed
 * @param initialPosition { x, y } for sticker placement
 */
interface VibeCheckStickerProps {
  summary: string;
  onLearnWhy: () => void;
  initialPosition?: { x: number; y: number };
}

/**
 * Draggable, resizable sticker for Vibe Check summary
 */
export default function VibeCheckSticker({
  summary,
  onLearnWhy,
  initialPosition = { x: 100, y: 200 },
}: VibeCheckStickerProps) {
  const [selected, setSelected] = useState(false);

  // Shared values for position and scale
  const translateX = useSharedValue(initialPosition.x);
  const translateY = useSharedValue(initialPosition.y);
  const scale = useSharedValue(1);

  // Pan gesture handler (drag)
  const panGesture = useAnimatedGestureHandler<PanGestureHandlerGestureEvent>({
    onStart: (_, ctx: any) => {
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx: any) => {
      translateX.value = ctx.startX + event.translationX;
      translateY.value = ctx.startY + event.translationY;
    },
  });

  // Pinch gesture handler (resize)
  const pinchGesture = useAnimatedGestureHandler<PinchGestureHandlerGestureEvent>({
    onStart: (_, ctx: any) => {
      ctx.startScale = scale.value;
    },
    onActive: (event, ctx: any) => {
      scale.value = Math.max(0.5, Math.min(2, ctx.startScale * event.scale));
    },
  });

  // Animated style
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: withSpring(translateX.value) },
      { translateY: withSpring(translateY.value) },
      { scale: withSpring(scale.value) },
    ],
  }));

  return (
    <PanGestureHandler
      onGestureEvent={panGesture}
      onActivated={() => setSelected(true)}
      onEnded={() => setSelected(false)}
    >
      <Animated.View style={[styles.sticker, animatedStyle]}>
        <PinchGestureHandler onGestureEvent={pinchGesture}>
          <Animated.View style={styles.innerSticker}>
            <TouchableOpacity activeOpacity={1} onPress={() => setSelected(!selected)}>
              <Text style={styles.summaryText}>{summary}</Text>
            </TouchableOpacity>
            {selected && (
              <TouchableOpacity style={styles.learnWhyButton} onPress={onLearnWhy}>
                <Text style={styles.learnWhyText}>Learn Why</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </PinchGestureHandler>
      </Animated.View>
    </PanGestureHandler>
  );
}

const styles = StyleSheet.create({
  sticker: {
    position: 'absolute',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 8,
  },
  innerSticker: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 24,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  summaryText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#222',
    textAlign: 'center',
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  learnWhyButton: {
    marginTop: 8,
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 16,
    alignSelf: 'center',
  },
  learnWhyText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
