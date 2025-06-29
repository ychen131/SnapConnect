/**
 * @file imageCacheService.ts
 * @description Service for caching images on device storage to improve loading performance
 */
import * as FileSystem from 'expo-file-system';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Cache configuration
export interface CacheConfig {
  maxCacheSizeMB: number;
  maxCacheAgeDays: number;
  cacheDirectory: string;
  imageQuality: number;
}

// Cache entry metadata
export interface CacheEntry {
  url: string;
  localPath: string;
  size: number;
  lastAccessed: number;
  createdAt: number;
  contentType: string;
}

// Default cache configuration
export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxCacheSizeMB: 100, // 100MB max cache size
  maxCacheAgeDays: 30, // 30 days max age
  cacheDirectory: `${FileSystem.cacheDirectory}image-cache/`,
  imageQuality: 0.8,
};

class ImageCacheService {
  private config: CacheConfig;
  private cacheIndex: Map<string, CacheEntry> = new Map();
  private isInitialized = false;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
  }

  /**
   * Initialize the cache service
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      // Create cache directory if it doesn't exist
      const dirInfo = await FileSystem.getInfoAsync(this.config.cacheDirectory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.config.cacheDirectory, { intermediates: true });
      }

      // Load cache index from storage
      await this.loadCacheIndex();

      // Clean up old cache entries
      await this.cleanupCache();

      this.isInitialized = true;
      console.log('📸 Image cache service initialized');
    } catch (error) {
      console.error('Failed to initialize image cache:', error);
    }
  }

  /**
   * Get cached image URI or download and cache if not available
   */
  async getCachedImage(url: string): Promise<string> {
    await this.initialize();

    // Check if image is already cached
    const cachedPath = await this.getCachedImagePath(url);
    if (cachedPath) {
      // Update last accessed time
      await this.updateLastAccessed(url);
      return cachedPath;
    }

    // Download and cache the image
    return await this.downloadAndCacheImage(url);
  }

  /**
   * Check if an image is cached
   */
  async isImageCached(url: string): Promise<boolean> {
    await this.initialize();
    const entry = this.cacheIndex.get(this.getCacheKey(url));
    if (!entry) return false;

    // Check if file still exists
    const fileInfo = await FileSystem.getInfoAsync(entry.localPath);
    return fileInfo.exists;
  }

  /**
   * Get the local path of a cached image
   */
  async getCachedImagePath(url: string): Promise<string | null> {
    await this.initialize();
    const entry = this.cacheIndex.get(this.getCacheKey(url));
    if (!entry) return null;

    // Check if file still exists
    const fileInfo = await FileSystem.getInfoAsync(entry.localPath);
    if (!fileInfo.exists) {
      // Remove from index if file doesn't exist
      this.cacheIndex.delete(this.getCacheKey(url));
      await this.saveCacheIndex();
      return null;
    }

    return entry.localPath;
  }

  /**
   * Download and cache an image
   */
  private async downloadAndCacheImage(url: string): Promise<string> {
    try {
      const cacheKey = this.getCacheKey(url);
      const fileName = `${cacheKey}.jpg`;
      const localPath = `${this.config.cacheDirectory}${fileName}`;

      console.log(`📥 Downloading image: ${url}`);

      // Download the image
      const downloadResult = await FileSystem.downloadAsync(url, localPath);

      if (downloadResult.status !== 200) {
        throw new Error(`Download failed with status: ${downloadResult.status}`);
      }

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      const size = (fileInfo as any).size || 0;

      // Create cache entry
      const entry: CacheEntry = {
        url,
        localPath,
        size,
        lastAccessed: Date.now(),
        createdAt: Date.now(),
        contentType: 'image/jpeg',
      };

      // Add to cache index
      this.cacheIndex.set(cacheKey, entry);
      await this.saveCacheIndex();

      // Check if we need to cleanup cache
      await this.cleanupCacheIfNeeded();

      console.log(`✅ Image cached: ${url} (${(size / 1024).toFixed(1)}KB)`);
      return localPath;
    } catch (error) {
      console.error(`❌ Failed to cache image ${url}:`, error);
      throw error;
    }
  }

  /**
   * Preload multiple images
   */
  async preloadImages(urls: string[]): Promise<void> {
    await this.initialize();

    const uncachedUrls = urls.filter((url) => !this.cacheIndex.has(this.getCacheKey(url)));

    if (uncachedUrls.length === 0) {
      console.log('📸 All images already cached');
      return;
    }

    console.log(`📥 Preloading ${uncachedUrls.length} images...`);

    // Download images in parallel (limit to 3 concurrent downloads)
    const batchSize = 3;
    for (let i = 0; i < uncachedUrls.length; i += batchSize) {
      const batch = uncachedUrls.slice(i, i + batchSize);
      await Promise.allSettled(batch.map((url) => this.downloadAndCacheImage(url)));
    }

    console.log('✅ Image preloading completed');
  }

  /**
   * Clear all cached images
   */
  async clearCache(): Promise<void> {
    try {
      // Delete cache directory
      await FileSystem.deleteAsync(this.config.cacheDirectory, { idempotent: true });

      // Clear cache index
      this.cacheIndex.clear();
      await this.saveCacheIndex();

      console.log('🗑️ Image cache cleared');
    } catch (error) {
      console.error('Failed to clear image cache:', error);
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    totalEntries: number;
    totalSizeMB: number;
    oldestEntry: number;
    newestEntry: number;
  }> {
    await this.initialize();

    const entries = Array.from(this.cacheIndex.values());
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const timestamps = entries.map((entry) => entry.createdAt);

    return {
      totalEntries: entries.length,
      totalSizeMB: totalSize / (1024 * 1024),
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : 0,
    };
  }

  /**
   * Clean up old and oversized cache entries
   */
  private async cleanupCache(): Promise<void> {
    const now = Date.now();
    const maxAge = this.config.maxCacheAgeDays * 24 * 60 * 60 * 1000;
    const maxSize = this.config.maxCacheSizeMB * 1024 * 1024;

    // Remove expired entries
    for (const [key, entry] of this.cacheIndex.entries()) {
      if (now - entry.createdAt > maxAge) {
        try {
          await FileSystem.deleteAsync(entry.localPath, { idempotent: true });
          this.cacheIndex.delete(key);
        } catch (error) {
          console.warn('Failed to delete expired cache entry:', error);
        }
      }
    }

    // Remove oversized entries (oldest first)
    let totalSize = Array.from(this.cacheIndex.values()).reduce(
      (sum, entry) => sum + entry.size,
      0,
    );
    if (totalSize > maxSize) {
      const sortedEntries = Array.from(this.cacheIndex.entries()).sort(
        ([, a], [, b]) => a.createdAt - b.createdAt,
      );

      for (const [key, entry] of sortedEntries) {
        if (totalSize <= maxSize) break;

        try {
          await FileSystem.deleteAsync(entry.localPath, { idempotent: true });
          this.cacheIndex.delete(key);
          totalSize -= entry.size;
        } catch (error) {
          console.warn('Failed to delete oversized cache entry:', error);
        }
      }
    }

    await this.saveCacheIndex();
  }

  /**
   * Clean up cache if it's getting too large
   */
  private async cleanupCacheIfNeeded(): Promise<void> {
    const stats = await this.getCacheStats();
    const maxSize = this.config.maxCacheSizeMB;

    if (stats.totalSizeMB > maxSize * 0.8) {
      // Cleanup when 80% full
      await this.cleanupCache();
    }
  }

  /**
   * Update last accessed time for a cache entry
   */
  private async updateLastAccessed(url: string): Promise<void> {
    const entry = this.cacheIndex.get(this.getCacheKey(url));
    if (entry) {
      entry.lastAccessed = Date.now();
      await this.saveCacheIndex();
    }
  }

  /**
   * Generate cache key from URL
   */
  private getCacheKey(url: string): string {
    // Create a hash of the URL for the filename
    let hash = 0;
    for (let i = 0; i < url.length; i++) {
      const char = url.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Load cache index from storage
   */
  private async loadCacheIndex(): Promise<void> {
    try {
      const indexData = await AsyncStorage.getItem('image-cache-index');
      if (indexData) {
        const parsed = JSON.parse(indexData);
        this.cacheIndex = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.warn('Failed to load cache index:', error);
      this.cacheIndex = new Map();
    }
  }

  /**
   * Save cache index to storage
   */
  private async saveCacheIndex(): Promise<void> {
    try {
      const indexData = Object.fromEntries(this.cacheIndex);
      await AsyncStorage.setItem('image-cache-index', JSON.stringify(indexData));
    } catch (error) {
      console.warn('Failed to save cache index:', error);
    }
  }
}

// Export singleton instance
export const imageCacheService = new ImageCacheService();

// Export the class for custom instances
export { ImageCacheService };
