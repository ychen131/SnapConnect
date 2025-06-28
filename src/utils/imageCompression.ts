/**
 * @file imageCompression.ts
 * @description Utility functions for optimizing image compression before API calls
 */

import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

// Compression configuration
export interface CompressionConfig {
  maxWidth: number;
  maxHeight: number;
  quality: number;
  format: 'jpeg' | 'png' | 'webp';
  maxFileSizeMB: number;
}

// Compression result
export interface CompressionResult {
  compressedBase64: string;
  originalSizeKB: number;
  compressedSizeKB: number;
  compressionRatio: number;
  dimensions: {
    original: { width: number; height: number };
    compressed: { width: number; height: number };
  };
}

// Default compression settings optimized for Vibe Check API
export const DEFAULT_COMPRESSION_CONFIG: CompressionConfig = {
  maxWidth: 1024, // Good balance between quality and size
  maxHeight: 1024,
  quality: 0.8, // 80% quality - good balance
  format: 'jpeg',
  maxFileSizeMB: 2, // Target 2MB max
};

/**
 * Calculates the optimal compression settings based on image dimensions and file size
 * @param imageUri Path to the image file
 * @param targetSizeMB Target file size in MB
 * @returns Optimized compression configuration
 */
export async function calculateOptimalCompression(
  imageUri: string,
  targetSizeMB: number = 2,
): Promise<CompressionConfig> {
  try {
    // Get image info
    const imageInfo = await ImageManipulator.manipulateAsync(imageUri, [], {
      format: ImageManipulator.SaveFormat.JPEG,
    });

    const { width, height } = imageInfo;
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    const currentSizeMB = ((fileInfo as any).size || 0) / (1024 * 1024);

    // If image is already small enough, use minimal compression
    if (currentSizeMB <= targetSizeMB) {
      return {
        maxWidth: Math.min(width, 1200),
        maxHeight: Math.min(height, 1200),
        quality: 0.9,
        format: 'jpeg',
        maxFileSizeMB: targetSizeMB,
      };
    }

    // Calculate compression ratio needed
    const compressionRatio = targetSizeMB / currentSizeMB;

    // Adjust quality based on compression needed
    let quality = 0.8;
    if (compressionRatio < 0.5) {
      quality = 0.6; // More aggressive compression
    } else if (compressionRatio < 0.7) {
      quality = 0.7;
    }

    // Calculate new dimensions while maintaining aspect ratio
    const aspectRatio = width / height;
    let newWidth = width;
    let newHeight = height;

    if (width > height) {
      newWidth = Math.min(width, 1024);
      newHeight = Math.round(newWidth / aspectRatio);
    } else {
      newHeight = Math.min(height, 1024);
      newWidth = Math.round(newHeight * aspectRatio);
    }

    // If still too large, reduce dimensions further
    if (newWidth * newHeight > 800 * 800) {
      const scale = Math.sqrt((800 * 800) / (newWidth * newHeight));
      newWidth = Math.round(newWidth * scale);
      newHeight = Math.round(newHeight * scale);
    }

    return {
      maxWidth: newWidth,
      maxHeight: newHeight,
      quality,
      format: 'jpeg',
      maxFileSizeMB: targetSizeMB,
    };
  } catch (error) {
    console.warn('Failed to calculate optimal compression, using defaults:', error);
    return DEFAULT_COMPRESSION_CONFIG;
  }
}

/**
 * Compresses an image file using the provided configuration
 * @param imageUri Path to the image file
 * @param config Compression configuration
 * @returns Promise with compression result
 */
export async function compressImage(
  imageUri: string,
  config: CompressionConfig = DEFAULT_COMPRESSION_CONFIG,
): Promise<CompressionResult> {
  try {
    // Get original image info
    const originalInfo = await ImageManipulator.manipulateAsync(imageUri, [], {
      format: ImageManipulator.SaveFormat.JPEG,
    });

    const originalFileInfo = await FileSystem.getInfoAsync(imageUri);
    const originalSizeKB = ((originalFileInfo as any).size || 0) / 1024;

    // Perform compression
    const result = await ImageManipulator.manipulateAsync(
      imageUri,
      [
        {
          resize: {
            width: config.maxWidth,
            height: config.maxHeight,
          },
        },
      ],
      {
        compress: config.quality,
        format:
          config.format === 'jpeg'
            ? ImageManipulator.SaveFormat.JPEG
            : config.format === 'png'
              ? ImageManipulator.SaveFormat.PNG
              : ImageManipulator.SaveFormat.WEBP,
      },
    );

    // Convert to base64
    const compressedBase64 = await FileSystem.readAsStringAsync(result.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Get compressed file info
    const compressedFileInfo = await FileSystem.getInfoAsync(result.uri);
    const compressedSizeKB = ((compressedFileInfo as any).size || 0) / 1024;

    // Clean up temporary file
    await FileSystem.deleteAsync(result.uri, { idempotent: true });

    return {
      compressedBase64,
      originalSizeKB,
      compressedSizeKB,
      compressionRatio: compressedSizeKB / originalSizeKB,
      dimensions: {
        original: { width: originalInfo.width, height: originalInfo.height },
        compressed: { width: result.width, height: result.height },
      },
    };
  } catch (error) {
    console.error('Image compression failed:', error);
    throw new Error(`Failed to compress image: ${(error as Error).message}`);
  }
}

/**
 * Compresses an image with automatic optimization for API calls
 * @param imageUri Path to the image file
 * @param targetSizeMB Target file size in MB (default: 2MB)
 * @returns Promise with optimized compression result
 */
export async function optimizeImageForAPI(
  imageUri: string,
  targetSizeMB: number = 2,
): Promise<CompressionResult> {
  try {
    // Calculate optimal compression settings
    const config = await calculateOptimalCompression(imageUri, targetSizeMB);

    // Perform compression
    const result = await compressImage(imageUri, config);

    console.log(
      `📸 Image optimized: ${result.originalSizeKB.toFixed(1)}KB → ${result.compressedSizeKB.toFixed(1)}KB (${(result.compressionRatio * 100).toFixed(1)}% reduction)`,
    );

    return result;
  } catch (error) {
    console.error('Image optimization failed:', error);
    throw new Error(`Failed to optimize image: ${(error as Error).message}`);
  }
}

/**
 * Validates if an image needs compression based on file size
 * @param imageUri Path to the image file
 * @param thresholdMB Size threshold in MB (default: 2MB)
 * @returns True if compression is recommended
 */
export async function needsCompression(
  imageUri: string,
  thresholdMB: number = 2,
): Promise<boolean> {
  try {
    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    const sizeMB = ((fileInfo as any).size || 0) / (1024 * 1024);
    return sizeMB > thresholdMB;
  } catch (error) {
    console.warn('Failed to check if compression is needed:', error);
    return true; // Default to compressing if we can't determine
  }
}

/**
 * Gets image information without modifying the image
 * @param imageUri Path to the image file
 * @returns Image information including dimensions and file size
 */
export async function getImageInfo(imageUri: string): Promise<{
  width: number;
  height: number;
  sizeKB: number;
  aspectRatio: number;
}> {
  try {
    const imageInfo = await ImageManipulator.manipulateAsync(imageUri, [], {
      format: ImageManipulator.SaveFormat.JPEG,
    });

    const fileInfo = await FileSystem.getInfoAsync(imageUri);
    const sizeKB = ((fileInfo as any).size || 0) / 1024;

    return {
      width: imageInfo.width,
      height: imageInfo.height,
      sizeKB,
      aspectRatio: imageInfo.width / imageInfo.height,
    };
  } catch (error) {
    console.error('Failed to get image info:', error);
    throw new Error(`Failed to get image info: ${(error as Error).message}`);
  }
}
