/**
 * @file vibeCheckService.ts
 * @description Service for calling the Supabase Edge Function for Vibe Check analysis.
 */

import { supabase } from './supabase';

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
    throw new Error(`API call failed: ${error.message}`);
  }
  if (!data) {
    throw new Error('No response data received from API');
  }
  return data as VibeCheckResponse;
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
