/**
 * @file FilteredImage.tsx
 * @description Skia-powered image component with real-time color matrix filters
 */
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import { Canvas, Image as SkiaImage, useImage, ColorMatrix } from '@shopify/react-native-skia';
import { useWindowDimensions, View } from 'react-native';

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
  canvasRef?: React.Ref<any>;
}

/**
 * Skia-powered image with color matrix filter
 * Now supports forwarding a ref to the Canvas for snapshot/export
 */
const FilteredImage = forwardRef<any, FilteredImageProps>(({ imageUri, filter }, ref) => {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const image = useImage(imageUri);
  const canvasRef = useRef<any>(null);

  useImperativeHandle(ref, () => ({
    makeImageSnapshot: () => {
      if (canvasRef.current) {
        return canvasRef.current.makeImageSnapshot();
      }
      return null;
    },
  }));

  if (!image) return null;
  // Maintain aspect ratio
  const aspectRatio = image.width() / image.height();
  console.log('image dimensions: ', image.width(), image.height());
  let width = windowWidth;
  let height = windowHeight;
  let y = 0;
  let x = 0;
  if (aspectRatio >= 1) {
    // landscape
    console.log('landscape');
    width = windowWidth;
    height = windowWidth / aspectRatio;
    y = windowHeight / 2 - height;
    // height = windowHeight;
    // width = windowHeight * aspectRatio;
  } else {
    // portrait
    console.log('portrait');
    width = windowHeight * aspectRatio;
    height = windowHeight;
    x = windowWidth / 2 - width / 2;
  }

  console.log('width', width);
  console.log('height', height);
  console.log('aspectRatio', aspectRatio);
  console.log('windowWidth', windowWidth);
  console.log('windowHeight', windowHeight);

  const matrix = FILTERS[filter] || undefined;

  return (
    <Canvas
      ref={canvasRef}
      style={{
        width: windowWidth,
        height: windowHeight,
        alignContent: 'center',
        justifyContent: 'center',
      }}
    >
      <SkiaImage image={image} x={x} y={y} width={width} height={height} fit="cover">
        {matrix && <ColorMatrix matrix={matrix} />}
      </SkiaImage>
    </Canvas>
  );
});

export default FilteredImage;
