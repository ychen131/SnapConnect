/**
 * @file useImagePreloader.ts
 * @description Custom hook for preloading images to improve app performance
 */
import { useState, useCallback } from 'react';
import { imageCacheService } from '../services/imageCacheService';

interface PreloadState {
  isPreloading: boolean;
  progress: number;
  total: number;
  completed: number;
  failed: number;
}

interface PreloadResult {
  success: boolean;
  url: string;
  error?: string;
}

/**
 * Custom hook for preloading images
 */
export function useImagePreloader() {
  const [preloadState, setPreloadState] = useState<PreloadState>({
    isPreloading: false,
    progress: 0,
    total: 0,
    completed: 0,
    failed: 0,
  });

  /**
   * Preload a single image
   */
  const preloadImage = useCallback(async (url: string): Promise<PreloadResult> => {
    try {
      await imageCacheService.getCachedImage(url);
      return { success: true, url };
    } catch (error) {
      return {
        success: false,
        url,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }, []);

  /**
   * Preload multiple images with progress tracking
   */
  const preloadImages = useCallback(
    async (urls: string[]): Promise<PreloadResult[]> => {
      if (urls.length === 0) return [];

      setPreloadState({
        isPreloading: true,
        progress: 0,
        total: urls.length,
        completed: 0,
        failed: 0,
      });

      const results: PreloadResult[] = [];
      let completed = 0;
      let failed = 0;

      // Process images in batches to avoid overwhelming the network
      const batchSize = 3;
      for (let i = 0; i < urls.length; i += batchSize) {
        const batch = urls.slice(i, i + batchSize);

        const batchResults = await Promise.allSettled(batch.map((url) => preloadImage(url)));

        batchResults.forEach((result, index) => {
          const url = batch[index];
          if (result.status === 'fulfilled') {
            results.push(result.value);
            if (result.value.success) {
              completed++;
            } else {
              failed++;
            }
          } else {
            results.push({ success: false, url, error: 'Promise rejected' });
            failed++;
          }
        });

        // Update progress
        const progress = Math.min(((i + batchSize) / urls.length) * 100, 100);
        setPreloadState({
          isPreloading: true,
          progress,
          total: urls.length,
          completed,
          failed,
        });
      }

      setPreloadState({
        isPreloading: false,
        progress: 100,
        total: urls.length,
        completed,
        failed,
      });

      return results;
    },
    [preloadImage],
  );

  /**
   * Preload images for a specific screen or component
   */
  const preloadForScreen = useCallback(
    async (screenName: string, urls: string[]) => {
      console.log(`📸 Preloading ${urls.length} images for ${screenName}`);
      return await preloadImages(urls);
    },
    [preloadImages],
  );

  /**
   * Check if images are already cached
   */
  const checkCachedImages = useCallback(async (urls: string[]): Promise<string[]> => {
    const cachedUrls: string[] = [];

    for (const url of urls) {
      const isCached = await imageCacheService.isImageCached(url);
      if (isCached) {
        cachedUrls.push(url);
      }
    }

    return cachedUrls;
  }, []);

  /**
   * Get cache statistics
   */
  const getCacheStats = useCallback(async () => {
    return await imageCacheService.getCacheStats();
  }, []);

  /**
   * Clear the image cache
   */
  const clearCache = useCallback(async () => {
    await imageCacheService.clearCache();
  }, []);

  return {
    preloadState,
    preloadImage,
    preloadImages,
    preloadForScreen,
    checkCachedImages,
    getCacheStats,
    clearCache,
  };
}
