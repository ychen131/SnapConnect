/**
 * @file vibeCheckCacheService.ts
 * @description Service for caching vibe check data to enable instant profile loading
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { VibeCheckRecord } from './vibeCheckService';

// Cache configuration
export interface VibeCheckCacheConfig {
  maxCacheAgeMinutes: number;
  maxCacheSizeMB: number;
}

// Cache entry metadata
export interface VibeCheckCacheEntry {
  userId: string;
  vibeChecks: VibeCheckRecord[];
  lastFetched: number;
  expiresAt: number;
  size: number; // Size in bytes
}

// Default cache configuration
export const DEFAULT_VIBE_CHECK_CACHE_CONFIG: VibeCheckCacheConfig = {
  maxCacheAgeMinutes: 5, // Cache for 5 minutes
  maxCacheSizeMB: 10, // 10MB max cache size
};

class VibeCheckCacheService {
  private config: VibeCheckCacheConfig;
  private cacheIndex: Map<string, VibeCheckCacheEntry> = new Map();
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor(config: Partial<VibeCheckCacheConfig> = {}) {
    this.config = { ...DEFAULT_VIBE_CHECK_CACHE_CONFIG, ...config };
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
      // Load cache index from storage
      await this.loadCacheIndex();

      // Clean up expired entries
      await this.cleanupCache();

      this.isInitialized = true;
      console.log('📊 Vibe check cache service initialized');
    } catch (error) {
      console.error('Failed to initialize vibe check cache:', error);
      throw error;
    } finally {
      // Clear the promise so future calls can retry if needed
      this.initializationPromise = null;
    }
  }

  /**
   * Get cached vibe checks for a user
   */
  async getCachedVibeChecks(userId: string): Promise<VibeCheckRecord[] | null> {
    await this.initialize();

    const entry = this.cacheIndex.get(userId);
    if (!entry) {
      return null;
    }

    // Check if cache has expired
    if (Date.now() > entry.expiresAt) {
      console.log(`📊 Vibe check cache expired for user: ${userId}`);
      this.cacheIndex.delete(userId);
      await this.saveCacheIndex();
      return null;
    }

    // Update last accessed time
    entry.lastFetched = Date.now();
    await this.saveCacheIndex();

    console.log(
      `📊 Returning cached vibe checks for user: ${userId} (${entry.vibeChecks.length} items)`,
    );
    return entry.vibeChecks;
  }

  /**
   * Cache vibe checks for a user
   */
  async cacheVibeChecks(userId: string, vibeChecks: VibeCheckRecord[]): Promise<void> {
    await this.initialize();

    try {
      const now = Date.now();
      const expiresAt = now + this.config.maxCacheAgeMinutes * 60 * 1000;

      // Calculate approximate size (rough estimate)
      const size = JSON.stringify(vibeChecks).length;

      const entry: VibeCheckCacheEntry = {
        userId,
        vibeChecks,
        lastFetched: now,
        expiresAt,
        size,
      };

      this.cacheIndex.set(userId, entry);
      await this.saveCacheIndex();

      // Check if we need to cleanup cache
      await this.cleanupCacheIfNeeded();

      console.log(
        `📊 Cached vibe checks for user: ${userId} (${vibeChecks.length} items, ${(size / 1024).toFixed(1)}KB)`,
      );
    } catch (error) {
      console.error(`Failed to cache vibe checks for user ${userId}:`, error);
    }
  }

  /**
   * Check if vibe checks are cached for a user
   */
  async isVibeChecksCached(userId: string): Promise<boolean> {
    await this.initialize();

    const entry = this.cacheIndex.get(userId);
    if (!entry) return false;

    // Check if cache has expired
    return Date.now() <= entry.expiresAt;
  }

  /**
   * Invalidate cache for a user (when vibe checks are added/deleted)
   */
  async invalidateCache(userId: string): Promise<void> {
    await this.initialize();

    if (this.cacheIndex.has(userId)) {
      this.cacheIndex.delete(userId);
      await this.saveCacheIndex();
      console.log(`📊 Invalidated vibe check cache for user: ${userId}`);
    }
  }

  /**
   * Clear all cached vibe checks
   */
  async clearCache(): Promise<void> {
    try {
      this.cacheIndex.clear();
      await this.saveCacheIndex();
      console.log('🗑️ Vibe check cache cleared');
    } catch (error) {
      console.error('Failed to clear vibe check cache:', error);
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
    cacheHitRate: number;
  }> {
    await this.initialize();

    const entries = Array.from(this.cacheIndex.values());
    const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
    const timestamps = entries.map((entry) => entry.lastFetched);

    // Calculate cache hit rate (this would need to be tracked separately)
    const cacheHitRate = 0; // TODO: Implement hit rate tracking

    return {
      totalEntries: entries.length,
      totalSizeMB: totalSize / (1024 * 1024),
      oldestEntry: timestamps.length > 0 ? Math.min(...timestamps) : 0,
      newestEntry: timestamps.length > 0 ? Math.max(...timestamps) : 0,
      cacheHitRate,
    };
  }

  /**
   * Clean up expired cache entries
   */
  private async cleanupCache(): Promise<void> {
    const now = Date.now();
    const maxAge = this.config.maxCacheAgeMinutes * 60 * 1000;

    // Remove expired entries
    for (const [userId, entry] of this.cacheIndex.entries()) {
      if (now - entry.lastFetched > maxAge) {
        this.cacheIndex.delete(userId);
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
   * Load cache index from storage
   */
  private async loadCacheIndex(): Promise<void> {
    try {
      const indexData = await AsyncStorage.getItem('vibe-check-cache-index');
      if (indexData) {
        const parsed = JSON.parse(indexData);
        this.cacheIndex = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.warn('Failed to load vibe check cache index:', error);
      this.cacheIndex = new Map();
    }
  }

  /**
   * Save cache index to storage
   */
  private async saveCacheIndex(): Promise<void> {
    try {
      const indexData = Object.fromEntries(this.cacheIndex);
      await AsyncStorage.setItem('vibe-check-cache-index', JSON.stringify(indexData));
    } catch (error) {
      console.warn('Failed to save vibe check cache index:', error);
    }
  }
}

// Export singleton instance
export const vibeCheckCacheService = new VibeCheckCacheService();

// Export the class for custom instances
export { VibeCheckCacheService };
