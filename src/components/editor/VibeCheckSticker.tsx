/**
 * @file VibeCheckSticker.tsx
 * @description Draggable, resizable sticker for displaying the Vibe Check short summary on a photo. Includes a 'Learn Why' button when selected.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Share } from 'react-native';
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
  withTiming,
  withRepeat,
  withSequence,
  useAnimatedGestureHandler,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';

/**
 * Props for VibeCheckSticker
 * @param summary The short summary (vibe) to display
 * @param onLearnWhy Callback when 'Learn Why' is pressed
 * @param initialPosition { x, y } for sticker placement
 * @param visible Whether the sticker should be visible (for entrance animation)
 * @param photoUri Optional photo URI for sharing
 * @param isLoading Whether the Vibe Check is currently loading
 * @param error Error message if the Vibe Check failed
 * @param onRetry Callback to retry the Vibe Check
 * @param isSuccess Whether the Vibe Check just completed successfully (for animation)
 */
interface VibeCheckStickerProps {
  summary: string;
  onLearnWhy: () => void;
  initialPosition?: { x: number; y: number };
  visible?: boolean;
  photoUri?: string;
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
  isSuccess?: boolean;
}

/**
 * Draggable, resizable sticker for Vibe Check summary with enhanced animations
 */
export default function VibeCheckSticker({
  summary,
  onLearnWhy,
  initialPosition = { x: 100, y: 200 },
  visible = true,
  photoUri,
  isLoading = false,
  error,
  onRetry,
  isSuccess = false,
}: VibeCheckStickerProps) {
  const [selected, setSelected] = useState(false);
  const [showSparkle, setShowSparkle] = useState(false);

  // Shared values for position and scale
  const translateX = useSharedValue(initialPosition.x);
  const translateY = useSharedValue(initialPosition.y);
  const scale = useSharedValue(1);

  // Animation values
  const opacity = useSharedValue(0);
  const entranceScale = useSharedValue(0.3);
  const selectionGlow = useSharedValue(0);
  const sparkleRotation = useSharedValue(0);
  const hoverScale = useSharedValue(1);
  const loadingRotation = useSharedValue(0);
  const errorShake = useSharedValue(0);
  const successPulse = useSharedValue(1);

  // Error shake animation
  useEffect(() => {
    if (error) {
      errorShake.value = withSequence(
        withTiming(-5, { duration: 100 }),
        withTiming(5, { duration: 100 }),
        withTiming(-5, { duration: 100 }),
        withTiming(5, { duration: 100 }),
        withTiming(0, { duration: 100 }),
      );
    }
  }, [error]);

  // Loading animation
  useEffect(() => {
    if (isLoading) {
      loadingRotation.value = withRepeat(withTiming(360, { duration: 1000 }), -1, false);
    } else {
      loadingRotation.value = withTiming(0, { duration: 200 });
    }
  }, [isLoading]);

  // Play success animation when isSuccess changes from false to true
  useEffect(() => {
    if (isSuccess) {
      setShowSparkle(true);
      successPulse.value = 1.2;
      setTimeout(() => {
        successPulse.value = 1;
        setShowSparkle(false);
      }, 600);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuccess]);

  // Share functionality
  const handleShare = async () => {
    try {
      const shareMessage = `🐕 My pup's vibe: "${summary}"\n\nCheck out this amazing Vibe Check feature! ✨`;

      const shareOptions = {
        message: shareMessage,
        title: "My Dog's Vibe Check",
        url: photoUri, // iOS only
      };

      const result = await Share.share(shareOptions);

      if (result.action === Share.sharedAction) {
        console.log('Content shared successfully');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      Alert.alert('Share Error', 'Unable to share at this time. Please try again.');
    }
  };

  // Copy to clipboard functionality
  const handleCopy = async () => {
    try {
      // For React Native, we'll use a simple alert for now
      // In a real app, you'd use @react-native-clipboard/clipboard
      const copyText = `🐕 My pup's vibe: "${summary}"`;
      Alert.alert('Copied!', 'Vibe Check summary copied to clipboard', [{ text: 'OK' }]);
      console.log('Text to copy:', copyText);
    } catch (error) {
      console.error('Error copying:', error);
      Alert.alert('Copy Error', 'Unable to copy at this time. Please try again.');
    }
  };

  // Entrance animation
  useEffect(() => {
    if (visible) {
      opacity.value = withTiming(1, { duration: 600 });
      entranceScale.value = withSpring(1, { damping: 12, stiffness: 100 });

      // Start sparkle animation
      sparkleRotation.value = withRepeat(
        withSequence(withTiming(360, { duration: 3000 }), withTiming(0, { duration: 0 })),
        -1,
        false,
      );
    }
  }, [visible]);

  // Selection animation
  useEffect(() => {
    if (selected) {
      selectionGlow.value = withSpring(1, { damping: 8, stiffness: 100 });
    } else {
      selectionGlow.value = withSpring(0, { damping: 8, stiffness: 100 });
    }
  }, [selected]);

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

  // Animated styles
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: withSpring(translateX.value + errorShake.value) },
      { translateY: withSpring(translateY.value) },
      {
        scale: withSpring(
          scale.value * entranceScale.value * hoverScale.value * successPulse.value,
        ),
      },
    ],
    opacity: opacity.value,
  }));

  const glowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(selectionGlow.value, [0, 1], [0.2, 0.6], Extrapolate.CLAMP),
    shadowRadius: interpolate(selectionGlow.value, [0, 1], [4, 12], Extrapolate.CLAMP),
    shadowColor: error ? '#FF6B6B' : '#FFD700',
  }));

  const sparkleStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sparkleRotation.value}deg` }],
  }));

  const loadingStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${loadingRotation.value}deg` }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(selected ? 1.05 : 1, { damping: 8, stiffness: 100 }) }],
    opacity: withTiming(selected ? 1 : 0, { duration: 200 }),
  }));

  return (
    <PanGestureHandler
      onGestureEvent={panGesture}
      onActivated={() => setSelected(true)}
      onEnded={() => setSelected(false)}
    >
      <Animated.View style={[styles.sticker, animatedStyle, glowStyle]}>
        <PinchGestureHandler onGestureEvent={pinchGesture}>
          <Animated.View style={[styles.innerSticker, error && styles.errorSticker]}>
            {/* Sparkle burst effect on success */}
            {showSparkle && (
              <View style={styles.sparkleBurstContainer} pointerEvents="none">
                {[...Array(8)].map((_, i) => (
                  <Animated.View
                    key={i}
                    style={[
                      styles.sparkleBurst,
                      {
                        transform: [{ rotate: `${i * 45}deg` }, { translateY: -24 }],
                      },
                    ]}
                  >
                    <Text style={styles.sparkleBurstText}>✨</Text>
                  </Animated.View>
                ))}
              </View>
            )}
            {/* Sparkle effect */}
            <Animated.View style={[styles.sparkle, sparkleStyle]}>
              <Text style={styles.sparkleText}>✨</Text>
            </Animated.View>

            <TouchableOpacity
              activeOpacity={1}
              onPress={() => setSelected(!selected)}
              onPressIn={() => {
                hoverScale.value = withSpring(1.05, { damping: 8, stiffness: 100 });
              }}
              onPressOut={() => {
                hoverScale.value = withSpring(1, { damping: 8, stiffness: 100 });
              }}
            >
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <Animated.View style={[styles.loadingSpinner, loadingStyle]}>
                    <Text style={styles.loadingText}>🐾</Text>
                  </Animated.View>
                  <Text style={styles.loadingMessage}>Checking vibe...</Text>
                </View>
              ) : error ? (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorIcon}>⚠️</Text>
                  <Text style={styles.errorText}>Vibe Check failed</Text>
                  <Text style={styles.errorMessage}>{error}</Text>
                </View>
              ) : (
                <Text style={styles.summaryText}>{summary}</Text>
              )}
            </TouchableOpacity>

            {!isLoading && !error && (
              <Animated.View style={buttonStyle}>
                <View style={styles.buttonContainer}>
                  <TouchableOpacity style={styles.learnWhyButton} onPress={onLearnWhy}>
                    <Text style={styles.learnWhyText}>Learn Why</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                    <Text style={styles.shareButtonText}>📤</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.copyButton} onPress={handleCopy}>
                    <Text style={styles.copyButtonText}>📋</Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}

            {error && onRetry && (
              <Animated.View style={buttonStyle}>
                <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
                  <Text style={styles.retryText}>🔄 Retry</Text>
                </TouchableOpacity>
              </Animated.View>
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
    position: 'relative',
  },
  errorSticker: {
    borderColor: '#FF6B6B',
    backgroundColor: 'rgba(255,255,255,0.98)',
  },
  sparkle: {
    position: 'absolute',
    top: -8,
    right: -8,
    zIndex: 1,
  },
  sparkleText: {
    fontSize: 16,
    textShadowColor: '#FFD700',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingSpinner: {
    marginBottom: 8,
  },
  loadingText: {
    fontSize: 24,
  },
  loadingMessage: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B6B',
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 4,
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
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 8,
    gap: 8,
  },
  learnWhyButton: {
    backgroundColor: '#FFD700',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  learnWhyText: {
    color: '#222',
    fontWeight: 'bold',
    fontSize: 14,
  },
  shareButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  shareButtonText: {
    fontSize: 16,
  },
  copyButton: {
    backgroundColor: '#2196F3',
    borderRadius: 16,
    paddingVertical: 4,
    paddingHorizontal: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  copyButtonText: {
    fontSize: 16,
  },
  retryButton: {
    backgroundColor: '#FF6B6B',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginTop: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  retryText: {
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 14,
  },
  sparkleBurstContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkleBurst: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    opacity: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sparkleBurstText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFD700',
    textShadowColor: '#fff',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
});
