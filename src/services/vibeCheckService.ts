/**
 * @file vibeCheckService.ts
 * @description Service for calling the Supabase Edge Function for Vibe Check analysis.
 */

import { supabase } from './supabase';
import { optimizeImageForAPI, needsCompression, getImageInfo } from '../utils/imageCompression';

// Request and response types
export interface VibeCheckRequest {
  imageBase64: string;
  userId: string;
}

export interface VisionAnalysis {
  bodyLanguage: string;
  mood: string;
  behavior: string;
  confidence: number;
}

export interface VibeCheckResponse {
  short_summary: string;
  detailed_report: string;
  sourceUrl: string;
  confidence: number;
  analysis: VisionAnalysis;
}

// Image quality validation types
interface ImageQualityValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface ImageDimensions {
  width: number;
  height: number;
}

// Confidence level handling types
interface ConfidenceLevel {
  level: 'high' | 'medium' | 'low' | 'very_low';
  message: string;
  shouldProceed: boolean;
  showWarning: boolean;
}

/**
 * Validates image quality before sending to API
 * @param imageBase64 Base64 encoded image string
 * @returns Validation result with errors and warnings
 */
export function validateImageQuality(imageBase64: string): ImageQualityValidation {
  const errors: string[] = [];
  const warnings: string[] = [];

  try {
    // Check if base64 string is valid
    if (!imageBase64 || typeof imageBase64 !== 'string') {
      errors.push('Invalid image data provided');
      return { isValid: false, errors, warnings };
    }

    // Remove data URL prefix if present
    const cleanBase64 = imageBase64.startsWith('data:') ? imageBase64.split(',')[1] : imageBase64;

    if (!cleanBase64) {
      errors.push('Invalid image format');
      return { isValid: false, errors, warnings };
    }

    // Check file size (max 10MB)
    const sizeInBytes = Math.ceil((cleanBase64.length * 3) / 4);
    const sizeInMB = sizeInBytes / (1024 * 1024);

    if (sizeInMB > 10) {
      errors.push('Image file size too large (max 10MB)');
    } else if (sizeInMB > 5) {
      warnings.push('Large image file (consider using a smaller photo for faster processing)');
    }

    // Check if base64 is valid
    try {
      atob(cleanBase64);
    } catch {
      errors.push('Invalid base64 image data');
      return { isValid: false, errors, warnings };
    }

    // For now, we'll assume the image is valid if it passes basic checks
    // In a real implementation, you might want to decode and check actual dimensions
    // This would require additional libraries or native image processing

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  } catch (error) {
    errors.push(`Image validation failed: ${(error as Error).message}`);
    return { isValid: false, errors, warnings };
  }
}

/**
 * Optimizes and compresses an image before API analysis
 * @param imageUri Path to the image file
 * @param targetSizeMB Target file size in MB (default: 2MB)
 * @returns Optimized base64 string and compression info
 */
export async function optimizeImageForVibeCheck(
  imageUri: string,
  targetSizeMB: number = 2,
): Promise<{ base64: string; compressionInfo?: any }> {
  try {
    // Check if compression is needed
    const shouldCompress = await needsCompression(imageUri, targetSizeMB);

    if (!shouldCompress) {
      // If no compression needed, just convert to base64
      const base64 = await import('expo-file-system').then((fs) =>
        fs.readAsStringAsync(imageUri, { encoding: fs.EncodingType.Base64 }),
      );
      return { base64 };
    }

    // Get original image info for logging
    const originalInfo = await getImageInfo(imageUri);
    console.log(
      `📸 Original image: ${originalInfo.width}x${originalInfo.height}, ${originalInfo.sizeKB.toFixed(1)}KB`,
    );

    // Optimize image for API
    const compressionResult = await optimizeImageForAPI(imageUri, targetSizeMB);

    return {
      base64: compressionResult.compressedBase64,
      compressionInfo: {
        originalSizeKB: compressionResult.originalSizeKB,
        compressedSizeKB: compressionResult.compressedSizeKB,
        compressionRatio: compressionResult.compressionRatio,
        dimensions: compressionResult.dimensions,
      },
    };
  } catch (error) {
    console.error('Image optimization failed, falling back to original:', error);

    // Fallback to original image if optimization fails
    const base64 = await import('expo-file-system').then((fs) =>
      fs.readAsStringAsync(imageUri, { encoding: fs.EncodingType.Base64 }),
    );
    return { base64 };
  }
}

/**
 * Calls the Supabase Edge Function to analyze a dog image.
 * @param imageBase64 - Base64 encoded image string
 * @param userId - User ID for the request
 * @returns Promise<VibeCheckResponse>
 */
export async function analyzeDogImage(
  imageBase64: string,
  userId: string,
): Promise<VibeCheckResponse> {
  const { data, error } = await supabase.functions.invoke('check-vibe-rag', {
    body: { imageBase64, userId },
  });

  if (error) {
    // Parse the error message to provide user-friendly feedback
    const errorMessage = error.message || 'Unknown error occurred';

    // Check for specific error patterns and provide user-friendly messages
    if (
      errorMessage.includes('unsupported image format') ||
      errorMessage.includes('image format')
    ) {
      throw new Error('The image format is not supported. Please try a JPEG or PNG photo.');
    }

    if (errorMessage.includes('no dog detected') || errorMessage.includes('dog not found')) {
      throw new Error(
        'No dog detected in the photo. Please make sure your dog is clearly visible in the image.',
      );
    }

    if (errorMessage.includes('image too small') || errorMessage.includes('resolution')) {
      throw new Error('The image is too small or blurry. Please try a higher quality photo.');
    }

    if (errorMessage.includes('network') || errorMessage.includes('connection')) {
      throw new Error(
        'Network connection issue. Please check your internet connection and try again.',
      );
    }

    if (errorMessage.includes('timeout') || errorMessage.includes('request timeout')) {
      throw new Error(
        'Request timed out. Please try again with a smaller image or better connection.',
      );
    }

    if (errorMessage.includes('500') || errorMessage.includes('internal server error')) {
      throw new Error('Service temporarily unavailable. Please try again in a few moments.');
    }

    // For any other errors, provide a generic but helpful message
    throw new Error(`Unable to analyze the photo: ${errorMessage}`);
  }

  if (!data) {
    throw new Error('No response received from the analysis service. Please try again.');
  }

  return data as VibeCheckResponse;
}

/**
 * Enhanced analyzeDogImage with image quality validation and compression optimization
 * @param imageUri Path to the image file (not base64)
 * @param userId User identifier
 * @returns Promise with vibe check analysis result
 */
export async function analyzeDogImageWithOptimization(
  imageUri: string,
  userId: string,
): Promise<VibeCheckResponse> {
  try {
    // Optimize image before API call
    const { base64: optimizedBase64, compressionInfo } = await optimizeImageForVibeCheck(imageUri);

    // Log compression results if available
    if (compressionInfo) {
      console.log(
        `🚀 Image optimized for API: ${compressionInfo.compressionRatio < 1 ? '✅' : '⚠️'} ${compressionInfo.originalSizeKB.toFixed(1)}KB → ${compressionInfo.compressedSizeKB.toFixed(1)}KB`,
      );
    }

    // Validate optimized image
    const validation = validateImageQuality(optimizedBase64);

    if (!validation.isValid) {
      throw new Error(`Image quality validation failed: ${validation.errors.join(', ')}`);
    }

    // Show warnings if any
    if (validation.warnings.length > 0) {
      console.warn('Image quality warnings:', validation.warnings);
    }

    // Proceed with analysis using optimized image
    return analyzeDogImage(optimizedBase64, userId);
  } catch (error) {
    console.error('Vibe Check with optimization failed:', error);
    throw error;
  }
}

/**
 * Enhanced analyzeDogImage with image quality validation
 * @param imageBase64 Base64 encoded image string
 * @param userId User identifier
 * @returns Promise with vibe check analysis result
 */
export async function analyzeDogImageWithValidation(
  imageBase64: string,
  userId: string,
): Promise<VibeCheckResponse> {
  // Validate image quality first
  const validation = validateImageQuality(imageBase64);

  if (!validation.isValid) {
    throw new Error(`Image quality validation failed: ${validation.errors.join(', ')}`);
  }

  // Show warnings if any
  if (validation.warnings.length > 0) {
    console.warn('Image quality warnings:', validation.warnings);
  }

  // Proceed with analysis
  return analyzeDogImage(imageBase64, userId);
}

/**
 * Processes confidence score and returns appropriate handling strategy
 * @param confidence Confidence score from 0 to 1
 * @returns Confidence level with user feedback and handling instructions
 */
export function processConfidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 0.7) {
    return {
      level: 'high',
      message: 'High confidence analysis',
      shouldProceed: true,
      showWarning: false,
    };
  } else if (confidence >= 0.5) {
    return {
      level: 'medium',
      message: 'Moderate confidence - analysis may be less accurate',
      shouldProceed: true,
      showWarning: true,
    };
  } else if (confidence >= 0.3) {
    return {
      level: 'low',
      message: 'Low confidence - please try a clearer photo',
      shouldProceed: true,
      showWarning: true,
    };
  } else {
    return {
      level: 'very_low',
      message: 'Image unclear - please try a better photo',
      shouldProceed: false,
      showWarning: false,
    };
  }
}

/**
 * Enhanced analyzeDogImage with confidence level handling
 * @param imageBase64 Base64 encoded image string
 * @param userId User identifier
 * @returns Promise with vibe check analysis result and confidence handling
 */
export async function analyzeDogImageWithConfidenceHandling(
  imageBase64: string,
  userId: string,
): Promise<{
  result: VibeCheckResponse;
  confidenceLevel: ConfidenceLevel;
  shouldRetry: boolean;
}> {
  try {
    // First validate image quality
    const validation = validateImageQuality(imageBase64);

    if (!validation.isValid) {
      throw new Error(`Image quality validation failed: ${validation.errors.join(', ')}`);
    }

    // Proceed with analysis
    const result = await analyzeDogImage(imageBase64, userId);

    // Process confidence level
    const confidenceLevel = processConfidenceLevel(result.confidence);

    // Log confidence for debugging (hidden from UI)
    console.log(`[DEBUG] Confidence score: ${result.confidence}, Level: ${confidenceLevel.level}`);

    // Determine if user should retry
    const shouldRetry = !confidenceLevel.shouldProceed;

    return {
      result,
      confidenceLevel,
      shouldRetry,
    };
  } catch (error) {
    // Re-throw the error for the UI to handle
    throw error;
  }
}

/**
 * Gets user-friendly message based on confidence level
 * @param confidenceLevel Processed confidence level
 * @returns User-friendly message for display
 */
export function getConfidenceUserMessage(confidenceLevel: ConfidenceLevel): string {
  switch (confidenceLevel.level) {
    case 'high':
      return '';
    case 'medium':
      return 'Analysis completed, but a clearer photo might give better results.';
    case 'low':
      return 'The photo is a bit unclear. Try taking a photo in better lighting or closer to your dog.';
    case 'very_low':
      return 'The image is too unclear to analyze. Please try a better photo with good lighting.';
    default:
      return '';
  }
}
