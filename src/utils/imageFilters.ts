/**
 * @file imageFilters.ts
 * @description Image processing utilities for applying filters, overlays, and image composition
 */

export type FilterType = 'original' | 'bw' | 'sepia' | 'vibrant' | 'cool' | 'warm';

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
 * Apply a filter to an image using CSS-like filters
 * Note: This is a simplified implementation. In a real app, you'd use native image processing
 */
export function applyFilter(imageUri: string, filterType: FilterType): Promise<string> {
  return new Promise((resolve) => {
    // For now, return the original image
    // TODO: Implement actual filter processing using expo-image-manipulator or similar
    console.log(`🎨 Applying filter: ${filterType} to image: ${imageUri}`);

    // Simulate processing delay
    setTimeout(() => {
      resolve(imageUri);
    }, 100);
  });
}

/**
 * Get filter display name
 */
export function getFilterDisplayName(filterType: FilterType): string {
  const names = {
    original: 'Original',
    bw: 'B&W',
    sepia: 'Sepia',
    vibrant: 'Vibrant',
    cool: 'Cool',
    warm: 'Warm',
  };
  return names[filterType];
}

/**
 * Get filter emoji icon
 */
export function getFilterIcon(filterType: FilterType): string {
  const icons = {
    original: '🖼️',
    bw: '⚫',
    sepia: '🟤',
    vibrant: '🌈',
    cool: '❄️',
    warm: '🔥',
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
