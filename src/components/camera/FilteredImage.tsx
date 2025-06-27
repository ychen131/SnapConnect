/**
 * @file FilteredImage.tsx
 * @description Skia-powered image component with real-time color matrix filters
 */
import React from 'react';
import { Canvas, Image as SkiaImage, useImage, ColorMatrix } from '@shopify/react-native-skia';
import { useWindowDimensions } from 'react-native';

// Color matrix definitions for filters
const FILTERS: Record<string, number[] | null> = {
  original: null,
  bw: [0.21, 0.72, 0.07, 0, 0, 0.21, 0.72, 0.07, 0, 0, 0.21, 0.72, 0.07, 0, 0, 0, 0, 0, 1, 0],
  sepia: [
    0.393, 0.769, 0.189, 0, 0, 0.349, 0.686, 0.168, 0, 0, 0.272, 0.534, 0.131, 0, 0, 0, 0, 0, 1, 0,
  ],
  vibrant: [1.3, 0.1, 0.1, 0, 0, 0.1, 1.3, 0.1, 0, 0, 0.1, 0.1, 1.3, 0, 0, 0, 0, 0, 1, 0],
  cool: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1.2, 0, 0, 0, 0, 0, 1, 0],
  warm: [1.2, 0, 0, 0, 0, 0, 1.1, 0, 0, 0, 0, 0, 0.9, 0, 0, 0, 0, 0, 1, 0],
  invert: [-1, 0, 0, 0, 1, 0, -1, 0, 0, 1, 0, 0, -1, 0, 1, 0, 0, 0, 1, 0],
  contrast: [1.1, 0, 0, 0, -0.05, 0, 1.1, 0, 0, -0.05, 0, 0, 1.1, 0, -0.05, 0, 0, 0, 1, 0],
  vintage: [0.9, 0.5, 0.1, 0, 0, 0.3, 0.8, 0.2, 0, 0, 0.2, 0.3, 0.7, 0, 0, 0, 0, 0, 1, 0],
  night: [0.6, 0, 0, 0, 0, 0, 0.7, 0, 0, 0, 0, 0, 1.3, 0, 0, 0, 0, 0, 1, 0],
};

export type SkiaFilterType = keyof typeof FILTERS;

interface FilteredImageProps {
  imageUri: string;
  filter: SkiaFilterType;
}

/**
 * Skia-powered image with color matrix filter
 */
export default function FilteredImage({ imageUri, filter }: FilteredImageProps) {
  const { width } = useWindowDimensions();
  const image = useImage(imageUri);

  if (!image) return null;

  // Maintain aspect ratio
  const aspectRatio = image.width() / image.height();
  const displayWidth = width;
  const displayHeight = width / aspectRatio;

  const matrix = FILTERS[filter] || undefined;

  return (
    <Canvas style={{ width: displayWidth, height: displayHeight }}>
      <SkiaImage
        image={image}
        x={0}
        y={0}
        width={displayWidth}
        height={displayHeight}
        fit="contain"
      >
        {matrix && <ColorMatrix matrix={matrix} />}
      </SkiaImage>
    </Canvas>
  );
}
