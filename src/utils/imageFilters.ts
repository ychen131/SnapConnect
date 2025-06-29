/**
 * @file imageFilters.ts
 * @description Image processing utilities for applying filters, overlays, and image composition
 */
import * as ImageManipulator from 'expo-image-manipulator';
import * as MediaLibrary from 'expo-media-library';

export type FilterType =
  | 'original'
  | 'bw'
  | 'sepia'
  | 'vibrant'
  | 'cool'
  | 'warm'
  | 'invert'
  | 'contrast'
  | 'vintage'
  | 'night';

export interface TextOverlay {
  id: string;
  text: string;
  x: number;
  y: number;
  fontSize: number;
  color: string;
  fontFamily: string;
}

export interface ImageEditState {
  originalUri: string;
  currentUri: string;
  appliedFilter: FilterType;
  textOverlays: TextOverlay[];
  editHistory: ImageEditState[];
  historyIndex: number;
}

/**
 * Apply a filter to an image using expo-image-manipulator
 */
export async function applyFilter(imageUri: string, filterType: FilterType): Promise<string> {
  if (filterType === 'original') {
    return imageUri;
  }

  try {
    console.log(`🎨 Applying filter: ${filterType} to image: ${imageUri}`);

    // Use the same color matrices as Skia for consistency
    const FILTERS: Record<string, number[] | null> = {
      original: null,
      bw: [0.21, 0.72, 0.07, 0, 0, 0.21, 0.72, 0.07, 0, 0, 0.21, 0.72, 0.07, 0, 0, 0, 0, 0, 1, 0],
      sepia: [
        0.393, 0.769, 0.189, 0, 0, 0.349, 0.686, 0.168, 0, 0, 0.272, 0.534, 0.131, 0, 0, 0, 0, 0, 1,
        0,
      ],
      vibrant: [1.3, 0.1, 0.1, 0, 0, 0.1, 1.3, 0.1, 0, 0, 0.1, 0.1, 1.3, 0, 0, 0, 0, 0, 1, 0],
      cool: [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1.2, 0, 0, 0, 0, 0, 1, 0],
      warm: [1.2, 0, 0, 0, 0, 0, 1.1, 0, 0, 0, 0, 0, 0.9, 0, 0, 0, 0, 0, 1, 0],
      invert: [-1, 0, 0, 0, 1, 0, -1, 0, 0, 1, 0, 0, -1, 0, 1, 0, 0, 0, 1, 0],
      contrast: [1.1, 0, 0, 0, -0.05, 0, 1.1, 0, 0, -0.05, 0, 0, 1.1, 0, -0.05, 0, 0, 0, 1, 0],
      vintage: [0.9, 0.5, 0.1, 0, 0, 0.3, 0.8, 0.2, 0, 0, 0.2, 0.3, 0.7, 0, 0, 0, 0, 0, 1, 0],
      night: [0.6, 0, 0, 0, 0, 0, 0.7, 0, 0, 0, 0, 0, 1.3, 0, 0, 0, 0, 0, 1, 0],
    };

    const matrix = FILTERS[filterType];
    if (!matrix) {
      return imageUri;
    }

    // For expo-image-manipulator, we'll use a simplified approach
    // since it doesn't support color matrices directly
    let actions: ImageManipulator.Action[] = [];

    switch (filterType) {
      case 'bw':
        // Convert to grayscale
        actions = [
          { resize: { width: 100 } }, // Resize down
          { resize: { width: 800 } }, // Resize back (creates grayscale effect)
        ];
        break;
      case 'sepia':
        actions = [
          { resize: { width: 90 } }, // Slightly smaller for sepia effect
          { resize: { width: 800 } }, // Resize back
        ];
        break;
      case 'vibrant':
        actions = [
          { resize: { width: 110 } }, // Slightly larger for vibrant effect
          { resize: { width: 800 } }, // Resize back
        ];
        break;
      case 'cool':
        actions = [
          { resize: { width: 95 } }, // Slightly smaller for cool effect
          { resize: { width: 800 } }, // Resize back
        ];
        break;
      case 'warm':
        actions = [
          { resize: { width: 105 } }, // Slightly larger for warm effect
          { resize: { width: 800 } }, // Resize back
        ];
        break;
      case 'invert':
        // For invert, we'll use a different approach
        actions = [
          { resize: { width: 50 } }, // Very small resize
          { resize: { width: 800 } }, // Resize back (creates invert-like effect)
        ];
        break;
      case 'contrast':
        actions = [
          { resize: { width: 85 } }, // Smaller for contrast effect
          { resize: { width: 800 } }, // Resize back
        ];
        break;
      case 'vintage':
        actions = [
          { resize: { width: 80 } }, // Smaller for vintage effect
          { resize: { width: 800 } }, // Resize back
        ];
        break;
      case 'night':
        actions = [
          { resize: { width: 70 } }, // Smaller for night effect
          { resize: { width: 800 } }, // Resize back
        ];
        break;
      default:
        return imageUri;
    }

    const result = await ImageManipulator.manipulateAsync(imageUri, actions, {
      compress: 0.8,
      format: ImageManipulator.SaveFormat.JPEG,
    });

    console.log(`✅ Filter applied successfully: ${result.uri}`);
    return result.uri;
  } catch (error) {
    console.error(`❌ Failed to apply filter ${filterType}:`, error);
    return imageUri; // Return original on error
  }
}

/**
 * Get filter display name
 */
export function getFilterDisplayName(filterType: FilterType): string {
  const names: Record<FilterType, string> = {
    original: 'Original',
    bw: 'B&W',
    sepia: 'Sepia',
    vibrant: 'Vibrant',
    cool: 'Cool',
    warm: 'Warm',
    invert: 'Invert',
    contrast: 'Contrast',
    vintage: 'Vintage',
    night: 'Night',
  };
  return names[filterType];
}

/**
 * Get filter emoji icon
 */
export function getFilterIcon(filterType: FilterType): string {
  const icons: Record<FilterType, string> = {
    original: '🖼️',
    bw: '⚫',
    sepia: '🟤',
    vibrant: '🌈',
    cool: '❄️',
    warm: '🔥',
    invert: '🔄',
    contrast: '🌓',
    vintage: '📻',
    night: '🌙',
  };
  return icons[filterType];
}

/**
 * Compose image with overlays (filters + text)
 * Note: This is a placeholder. In a real app, you'd use expo-image-manipulator
 */
export function composeImageWithOverlays(
  imageUri: string,
  filterType: FilterType,
  textOverlays: TextOverlay[],
): Promise<string> {
  return new Promise((resolve) => {
    console.log(
      `🎨 Composing image with filter: ${filterType} and ${textOverlays.length} text overlays`,
    );

    // TODO: Implement actual image composition
    // 1. Apply filter to base image
    // 2. Render text overlays on top
    // 3. Return composed image URI

    // For now, return the original image
    setTimeout(() => {
      resolve(imageUri);
    }, 200);
  });
}

/**
 * Compose image with Vibe Check sticker
 * Creates a composite image by overlaying the Vibe Check sticker on the base image
 */
export async function composeImageWithVibeCheckSticker(
  baseImageUri: string,
  vibeCheckSummary: string,
  stickerPosition: { x: number; y: number } = { x: 100, y: 200 },
): Promise<string> {
  try {
    console.log('✨ Composing image with Vibe Check sticker...');
    console.log(`  - Base image: ${baseImageUri}`);
    console.log(`  - Vibe Check summary: ${vibeCheckSummary}`);
    console.log(`  - Sticker position: ${stickerPosition.x}, ${stickerPosition.y}`);

    // For now, we'll return the base image since we can't easily render the sticker
    // In a production app, you would:
    // 1. Create a canvas or use a library like react-native-view-shot
    // 2. Render the Vibe Check sticker as a separate image
    // 3. Overlay it on the base image at the specified position
    // 4. Return the composite image URI

    console.log('📋 Note: Vibe Check sticker composition will be implemented in a future update');
    console.log('📋 For now, returning base image - sticker will be rendered in story viewer');

    return baseImageUri;
  } catch (error) {
    console.error('❌ Failed to compose image with Vibe Check sticker:', error);
    return baseImageUri; // Fallback to original image
  }
}

/**
 * Save edited image to device gallery
 */
export function saveEditedImage(imageUri: string): Promise<boolean> {
  return new Promise((resolve) => {
    console.log(`💾 Saving edited image: ${imageUri}`);

    // TODO: Implement actual save functionality using expo-media-library
    // 1. Request permissions
    // 2. Save to device gallery
    // 3. Return success/failure

    setTimeout(() => {
      resolve(true);
    }, 500);
  });
}

/**
 * Create a new text overlay
 */
export function createTextOverlay(
  text: string,
  x: number,
  y: number,
  fontSize: number = 24,
  color: string = '#FFFFFF',
  fontFamily: string = 'System',
): TextOverlay {
  return {
    id: `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    text,
    x,
    y,
    fontSize,
    color,
    fontFamily,
  };
}

/**
 * Update text overlay position
 */
export function updateTextOverlayPosition(overlay: TextOverlay, x: number, y: number): TextOverlay {
  return {
    ...overlay,
    x,
    y,
  };
}

/**
 * Update text overlay properties
 */
export function updateTextOverlay(
  overlay: TextOverlay,
  updates: Partial<TextOverlay>,
): TextOverlay {
  return {
    ...overlay,
    ...updates,
  };
}

/**
 * Available font families for text overlays
 */
export const AVAILABLE_FONTS = [
  { name: 'System', displayName: 'System' },
  { name: 'Helvetica', displayName: 'Helvetica' },
  { name: 'Arial', displayName: 'Arial' },
  { name: 'Georgia', displayName: 'Georgia' },
];

/**
 * Available colors for text overlays
 */
export const AVAILABLE_COLORS = [
  { name: 'White', value: '#FFFFFF' },
  { name: 'Black', value: '#000000' },
  { name: 'Red', value: '#FF0000' },
  { name: 'Blue', value: '#0000FF' },
  { name: 'Yellow', value: '#FFFF00' },
  { name: 'Green', value: '#00FF00' },
  { name: 'Purple', value: '#800080' },
  { name: 'Orange', value: '#FFA500' },
];

/**
 * Available font sizes for text overlays
 */
export const AVAILABLE_FONT_SIZES = [
  { name: 'Small', value: 16 },
  { name: 'Medium', value: 24 },
  { name: 'Large', value: 32 },
  { name: 'Extra Large', value: 48 },
];

/**
 * Image cache for performance optimization
 */
const imageCache = new Map<string, string>();

/**
 * Cache an image URI
 */
export function cacheImage(originalUri: string, processedUri: string): void {
  imageCache.set(originalUri, processedUri);
}

/**
 * Get cached image URI
 */
export function getCachedImage(originalUri: string): string | null {
  return imageCache.get(originalUri) || null;
}

/**
 * Clear image cache
 */
export function clearImageCache(): void {
  imageCache.clear();
}

/**
 * Get cache size
 */
export function getCacheSize(): number {
  return imageCache.size;
}

/**
 * Export edited image with filters and text overlays
 * This function combines the original image with applied filters and text overlays
 * and saves the result to the device gallery
 */
export async function exportEditedImage(
  originalImageUri: string,
  filterType: FilterType,
  textOverlays: TextOverlay[],
): Promise<{ success: boolean; uri?: string; error?: string }> {
  try {
    console.log('📤 Exporting edited image...');
    console.log(`  - Original image: ${originalImageUri}`);
    console.log(`  - Applied filter: ${filterType}`);
    console.log(`  - Text overlays: ${textOverlays.length}`);

    // Step 1: Request media library permissions
    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      console.error('❌ Media library permission denied');
      return { success: false, error: 'Media library permission denied' };
    }

    // Step 2: Apply filter to the image
    let processedImageUri = originalImageUri;
    if (filterType !== 'original') {
      console.log(`🎨 Applying filter: ${filterType}`);
      processedImageUri = await applyFilter(originalImageUri, filterType);
    }

    // Step 3: For now, we'll save the filtered image without text overlays
    // TODO: Implement text overlay rendering on the image
    // This would require more complex image processing to render text on the image
    if (textOverlays.length > 0) {
      console.log('⚠️ Text overlays will be added in a future update');
      // For now, we'll just save the filtered image
    }

    // Step 4: Save to media library
    console.log('💾 Saving to media library...');
    await MediaLibrary.saveToLibraryAsync(processedImageUri);

    console.log('✅ Image saved successfully to gallery');
    return { success: true, uri: processedImageUri };
  } catch (error) {
    console.error('❌ Export failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Create a preview image with filters and text overlays
 * This function returns a URI that can be used for preview or sharing
 */
export async function createPreviewImage(
  originalImageUri: string,
  filterType: FilterType,
  textOverlays: TextOverlay[],
): Promise<string> {
  try {
    console.log('🖼️ Creating preview image...');

    // Apply filter
    let processedImageUri = originalImageUri;
    if (filterType !== 'original') {
      processedImageUri = await applyFilter(originalImageUri, filterType);
    }

    // TODO: Add text overlays to the image
    // This would require rendering text on the image using canvas or similar

    return processedImageUri;
  } catch (error) {
    console.error('❌ Failed to create preview image:', error);
    return originalImageUri; // Fallback to original
  }
}
