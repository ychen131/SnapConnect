/**
 * @file CachedImage.tsx
 * @description Image component with automatic caching for better performance
 */
import React, { useState, useEffect } from 'react';
import { Image, ImageProps, ActivityIndicator, View, StyleSheet } from 'react-native';
import { imageCacheService } from '../../services/imageCacheService';

interface CachedImageProps extends Omit<ImageProps, 'source'> {
  /** URL of the image to display */
  uri?: string | null;
  /** Fallback image source when loading or on error */
  fallbackSource?: any;
  /** Show loading indicator while caching */
  showLoadingIndicator?: boolean;
  /** Loading indicator color */
  loadingColor?: string;
  /** Loading indicator size */
  loadingSize?: 'small' | 'large';
  /** Container style for loading indicator */
  loadingContainerStyle?: any;
  /** Callback when image starts loading */
  onLoadStart?: () => void;
  /** Callback when image loads successfully */
  onLoad?: (event: any) => void;
  /** Callback when image fails to load */
  onError?: (error: any) => void;
  /** Callback when caching is complete */
  onCacheComplete?: (cachedUri: string) => void;
}

/**
 * Image component with automatic caching
 */
export default function CachedImage({
  uri,
  fallbackSource,
  showLoadingIndicator = true,
  loadingColor = '#3B82F6',
  loadingSize = 'small',
  loadingContainerStyle,
  onLoadStart,
  onLoad,
  onError,
  onCacheComplete,
  style,
  ...imageProps
}: CachedImageProps) {
  const [cachedUri, setCachedUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (!uri) {
      setCachedUri(null);
      setHasError(false);
      return;
    }

    let isMounted = true;

    const loadCachedImage = async () => {
      try {
        setIsLoading(true);
        setHasError(false);
        onLoadStart?.();

        const cachedPath = await imageCacheService.getCachedImage(uri);

        if (isMounted) {
          setCachedUri(cachedPath);
          onCacheComplete?.(cachedPath);
        }
      } catch (error) {
        console.error('Failed to load cached image:', error);
        if (isMounted) {
          setHasError(true);
          onError?.(error);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadCachedImage();

    return () => {
      isMounted = false;
    };
  }, [uri, onLoadStart, onError, onCacheComplete]);

  // Show loading indicator
  if (isLoading && showLoadingIndicator) {
    return (
      <View style={[styles.loadingContainer, loadingContainerStyle]}>
        <ActivityIndicator size={loadingSize} color={loadingColor} />
      </View>
    );
  }

  // Show fallback or error state
  if (hasError || !cachedUri) {
    return (
      <View style={[styles.fallbackContainer, style]}>
        {/* Completely transparent fallback - no visual clutter */}
      </View>
    );
  }

  // Show cached image
  return (
    <Image
      source={{ uri: cachedUri }}
      style={style}
      onLoad={onLoad}
      onError={(error) => {
        setHasError(true);
        onError?.(error);
      }}
      {...imageProps}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  fallbackContainer: {
    backgroundColor: 'transparent',
  },
});
