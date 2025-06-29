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
  private initializationPromise: Promise<void> | null = null;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CACHE_CONFIG, ...config };
  }

  /**
   * Initialize the cache service (only once)
   */
  async initialize(): Promise<void> {
    // If already initialized, return immediately
    if (this.isInitialized) {
      return;
    }

    // If initialization is in progress, wait for it to complete
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Start initialization
    this.initializationPromise = this.performInitialization();
    return this.initializationPromise;
  }

  /**
   * Perform the actual initialization
   */
  private async performInitialization(): Promise<void> {
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
      throw error;
    } finally {
      // Clear the promise so future calls can retry if needed
      this.initializationPromise = null;
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

    // Check if this is an Expo cache file - return as-is
    if (this.isExpoCacheFile(url)) {
      console.log(`📱 Using Expo cached file: ${url}`);
      return url;
    }

    // Check if this is a local file URL
    if (this.isLocalFile(url)) {
      // Check if the local file exists
      const fileInfo = await FileSystem.getInfoAsync(url);
      if (!fileInfo.exists) {
        console.warn(`⚠️ Local file not found, returning original URL: ${url}`);
        return url; // Return original URL if file doesn't exist
      }
      return await this.copyLocalFile(url);
    }

    // Download and cache the image
    return await this.downloadAndCacheImage(url);
  }

  /**
   * Check if an image is cached
   */
  async isImageCached(url: string): Promise<boolean> {
    await this.initialize();

    // Expo cache files are considered cached
    if (this.isExpoCacheFile(url)) {
      return true;
    }

    // For local files, check if they exist and are readable
    if (this.isLocalFile(url)) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(url);
        return fileInfo.exists;
      } catch (error) {
        console.warn(`⚠️ Error checking local file: ${url}`, error);
        return false;
      }
    }

    // For remote URLs, check cache index
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

    // Expo cache files are considered cached
    if (this.isExpoCacheFile(url)) {
      return url;
    }

    // For local files, return the original path if it exists
    if (this.isLocalFile(url)) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(url);
        return fileInfo.exists ? url : null;
      } catch (error) {
        console.warn(`⚠️ Error checking local file path: ${url}`, error);
        return null;
      }
    }

    // For remote URLs, check cache index
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

    // Separate different types of URLs
    const expoCacheFiles = urls.filter((url) => this.isExpoCacheFile(url));
    const localFiles = urls.filter((url) => this.isLocalFile(url) && !this.isExpoCacheFile(url));
    const remoteUrls = urls.filter((url) => !this.isLocalFile(url));

    // Log Expo cache files (already cached)
    if (expoCacheFiles.length > 0) {
      console.log(`📱 Skipping ${expoCacheFiles.length} Expo cached files`);
    }

    // Handle local files first (just verify they exist)
    for (const localFile of localFiles) {
      try {
        const fileInfo = await FileSystem.getInfoAsync(localFile);
        if (!fileInfo.exists) {
          console.warn(`⚠️ Local file not found during preload: ${localFile}`);
        }
      } catch (error) {
        console.warn(`⚠️ Error checking local file during preload: ${localFile}`, error);
      }
    }

    // Handle remote URLs that aren't already cached
    const uncachedUrls = remoteUrls.filter((url) => !this.cacheIndex.has(this.getCacheKey(url)));

    if (uncachedUrls.length === 0) {
      console.log('📸 All remote images already cached');
      return;
    }

    console.log(`📥 Preloading ${uncachedUrls.length} remote images...`);

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

  /**
   * Check if a URL is a local file
   */
  private isLocalFile(url: string): boolean {
    return url.startsWith('file://') || url.startsWith('/');
  }

  /**
   * Check if a URL is in Expo's cache directory
   */
  private isExpoCacheFile(url: string): boolean {
    return url.includes('ExponentExperienceData') || url.includes('Library/Caches');
  }

  /**
   * Copy a local file to the cache directory
   */
  private async copyLocalFile(localPath: string): Promise<string> {
    try {
      const cacheKey = this.getCacheKey(localPath);
      const fileName = `${cacheKey}.jpg`;
      const cachedPath = `${this.config.cacheDirectory}${fileName}`;

      console.log(`📋 Copying local file: ${localPath}`);

      // Check if source file exists
      const sourceInfo = await FileSystem.getInfoAsync(localPath);
      if (!sourceInfo.exists) {
        throw new Error(`Source file does not exist: ${localPath}`);
      }

      // Copy the file
      await FileSystem.copyAsync({
        from: localPath,
        to: cachedPath,
      });

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(cachedPath);
      const size = (fileInfo as any).size || 0;

      // Create cache entry
      const entry: CacheEntry = {
        url: localPath,
        localPath: cachedPath,
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

      console.log(`✅ Local file cached: ${localPath} (${(size / 1024).toFixed(1)}KB)`);
      return cachedPath;
    } catch (error) {
      console.error(`❌ Failed to cache local file ${localPath}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const imageCacheService = new ImageCacheService();

// Export the class for custom instances
export { ImageCacheService };
