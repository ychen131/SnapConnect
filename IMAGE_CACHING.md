# Image Caching Implementation

This document describes the image caching system implemented in the SnapConnect app to improve loading performance for profile pictures, vibe check images, and other media.

## Overview

The image caching system automatically downloads and stores images on the device's file system, providing faster loading times for previously viewed images and reducing network usage.

## Components

### 1. ImageCacheService (`src/services/imageCacheService.ts`)

The core service that handles:

- Downloading and caching images to device storage
- Managing cache metadata and cleanup
- Providing cache statistics
- Automatic cache size management

**Key Features:**

- Persistent storage using `expo-file-system`
- Automatic cleanup of old/oversized cache entries
- Cache index stored in AsyncStorage
- Configurable cache size limits (default: 100MB)
- Configurable cache age limits (default: 30 days)

**Usage:**

```typescript
import { imageCacheService } from '../services/imageCacheService';

// Get cached image (downloads if not cached)
const cachedPath = await imageCacheService.getCachedImage(imageUrl);

// Check if image is cached
const isCached = await imageCacheService.isImageCached(imageUrl);

// Preload multiple images
await imageCacheService.preloadImages([url1, url2, url3]);

// Get cache statistics
const stats = await imageCacheService.getCacheStats();

// Clear all cached images
await imageCacheService.clearCache();
```

### 2. CachedImage Component (`src/components/ui/CachedImage.tsx`)

A React Native Image component wrapper that automatically handles caching:

**Props:**

- `uri`: URL of the image to display
- `fallbackSource`: Fallback image when loading or on error
- `showLoadingIndicator`: Show loading spinner (default: true)
- `loadingColor`: Color of loading indicator
- `loadingSize`: Size of loading indicator ('small' | 'large')
- `onCacheComplete`: Callback when caching is complete

**Usage:**

```typescript
import CachedImage from '../components/ui/CachedImage';

<CachedImage
  uri="https://example.com/image.jpg"
  style={{ width: 100, height: 100 }}
  fallbackSource={require('../assets/placeholder.png')}
  showLoadingIndicator={true}
  onCacheComplete={(cachedUri) => console.log('Image cached:', cachedUri)}
/>
```

### 3. useImagePreloader Hook (`src/hooks/useImagePreloader.ts`)

A custom hook for preloading images with progress tracking:

**Features:**

- Batch preloading with progress tracking
- Screen-specific preloading
- Cache statistics
- Cache management

**Usage:**

```typescript
import { useImagePreloader } from '../hooks/useImagePreloader';

function MyComponent() {
  const { preloadForScreen, preloadState, getCacheStats, clearCache } = useImagePreloader();

  // Preload images for a specific screen
  const preloadImages = async () => {
    await preloadForScreen('ProfileScreen', imageUrls);
  };

  // Access preloading state
  console.log('Preloading progress:', preloadState.progress);

  return (
    // Component JSX
  );
}
```

## Integration Examples

### Avatar Component

The Avatar component has been updated to use CachedImage:

```typescript
// Before
<Image source={{ uri: avatarUrl }} style={styles.avatar} />

// After
<CachedImage
  uri={avatarUrl}
  style={styles.avatar}
  fallbackSource={require('../assets/default-avatar.png')}
  showLoadingIndicator={false}
/>
```

### Chat Screen

The ChatScreen preloads avatar images when conversations are loaded:

```typescript
// In fetchConversations function
const avatarUrls = data
  .map((conv) => conv.other_user_avatar_url)
  .filter((url): url is string => url !== null && url !== undefined && url.trim() !== '');

if (avatarUrls.length > 0) {
  preloadForScreen('ChatScreen', avatarUrls);
}
```

### Profile Screen

The ProfileScreen preloads vibe check images:

```typescript
// In refreshCloudVibes function
const imageUrls = vibes
  .map((vibe) => vibe.source_url)
  .filter((url): url is string => url !== null && url !== undefined && url.trim() !== '');

if (imageUrls.length > 0) {
  preloadForScreen('ProfileScreen', imageUrls);
}
```

## Settings Integration

The Settings screen includes cache management options:

- **Cache Statistics**: Shows number of cached images, total size, and oldest entry
- **Clear Cache**: Button to remove all cached images
- **Automatic Cleanup**: Cache is automatically cleaned when it reaches 80% capacity

## Configuration

The cache can be configured by modifying the `DEFAULT_CACHE_CONFIG` in `imageCacheService.ts`:

```typescript
export const DEFAULT_CACHE_CONFIG: CacheConfig = {
  maxCacheSizeMB: 100, // Maximum cache size
  maxCacheAgeDays: 30, // Maximum age of cache entries
  cacheDirectory: `${FileSystem.cacheDirectory}image-cache/`,
  imageQuality: 0.8, // Image quality for caching
};
```

## Performance Benefits

1. **Faster Loading**: Cached images load instantly from device storage
2. **Reduced Network Usage**: Images are only downloaded once
3. **Better User Experience**: No loading spinners for previously viewed images
4. **Offline Support**: Cached images work without internet connection
5. **Automatic Management**: Cache is automatically cleaned to prevent storage issues

## Testing

Run the image cache tests:

```bash
npm test -- imageCacheService.test.ts
```

## Best Practices

1. **Preload Strategically**: Preload images for screens users are likely to visit
2. **Use Fallbacks**: Always provide fallback images for better UX
3. **Monitor Cache Size**: Check cache statistics in settings
4. **Clear Cache When Needed**: Provide users with option to clear cache if storage is limited
5. **Handle Errors Gracefully**: The system handles network errors and invalid URLs

## Troubleshooting

### Common Issues

1. **Images not caching**: Check network connectivity and URL validity
2. **Cache not persisting**: Verify AsyncStorage permissions
3. **Storage issues**: Clear cache manually or reduce cache size limit
4. **Performance issues**: Monitor cache statistics and adjust batch sizes

### Debug Information

Enable debug logging by checking console output:

- `📸 Image cache service initialized`
- `📥 Downloading image: [URL]`
- `✅ Image cached: [URL] ([SIZE]KB)`
- `🗑️ Image cache cleared`
