# Vibe Check Caching Implementation

This document describes the vibe check caching system implemented in the SnapConnect app to enable instant profile loading with background refresh capabilities.

## Overview

The vibe check caching system stores vibe check data locally on the device, allowing profile pages to load instantly with cached data while refreshing fresh data in the background. This provides a much better user experience with no loading spinners for previously viewed profiles.

## Architecture

### 1. VibeCheckCacheService (`src/services/vibeCheckCacheService.ts`)

The core service that handles:

- Caching vibe check data by user ID
- Managing cache expiration (5-minute default)
- Automatic cache cleanup and size management
- Cache invalidation when vibe checks are added/deleted

**Key Features:**

- Persistent storage using AsyncStorage
- Configurable cache age limits (default: 5 minutes)
- Configurable cache size limits (default: 10MB)
- Automatic cleanup of expired entries
- Cache statistics and monitoring

**Usage:**

```typescript
import { vibeCheckCacheService } from '../services/vibeCheckCacheService';

// Get cached vibe checks
const cachedVibeChecks = await vibeCheckCacheService.getCachedVibeChecks(userId);

// Cache vibe checks
await vibeCheckCacheService.cacheVibeChecks(userId, vibeChecks);

// Check if cached
const isCached = await vibeCheckCacheService.isVibeChecksCached(userId);

// Invalidate cache (when vibe checks are added/deleted)
await vibeCheckCacheService.invalidateCache(userId);

// Get cache statistics
const stats = await vibeCheckCacheService.getCacheStats();
```

### 2. Enhanced Vibe Check Service (`src/services/vibeCheckService.ts`)

Updated service with cache-aware functions:

**New Functions:**

- `fetchVibeChecksWithCache()` - Returns cached data immediately if available
- `fetchVibeChecksInBackground()` - Fetches fresh data without blocking UI
- Enhanced `saveVibeCheckToCloud()` - Automatically invalidates cache
- Enhanced `deleteVibeCheckFromCloud()` - Automatically invalidates cache

**Usage:**

```typescript
import {
  fetchVibeChecksWithCache,
  fetchVibeChecksInBackground,
} from '../services/vibeCheckService';

// Load with cache support
const vibeChecks = await fetchVibeChecksWithCache(userId, true);

// Background refresh
const freshVibeChecks = await fetchVibeChecksInBackground(userId);
```

### 3. Updated Profile Screen (`src/screens/Main/ProfileScreen.tsx`)

The ProfileScreen now implements a sophisticated loading pattern:

**Loading States:**

- `isLoadingFromCache` - Loading cached data
- `isRefreshing` - Refreshing fresh data in background
- `cloudVibeChecks` - Current vibe checks to display

**Loading Flow:**

1. **Immediate Load**: Try to load cached vibe checks instantly
2. **Display Cached**: Show cached data immediately if available
3. **Background Refresh**: Fetch fresh data without blocking UI
4. **Smart Update**: Only update UI if data has actually changed
5. **Image Persistence**: Existing images stay visible during refresh

**User Experience:**

- **First Visit**: Shows loading spinner, then vibe checks
- **Subsequent Visits**: Vibe checks appear instantly, fresh data loads in background
- **Cache Expired**: Shows cached data while refreshing in background
- **No Cache**: Falls back to normal loading behavior
- **Smooth Transitions**: Images never flicker or disappear during refresh

**Smart Update Logic:**

- Compares fresh data with current data by ID
- Only updates UI if vibe checks have actually changed
- Maintains existing images during background refresh
- Handles network errors gracefully without clearing existing data

### 4. Enhanced Settings Screen (`src/screens/Main/SettingsScreen.tsx`)

Added comprehensive cache management:

**New Features:**

- Vibe check cache statistics
- Individual cache clearing (images vs vibe checks)
- Combined cache clearing
- Cache hit rate monitoring

## Performance Benefits

1. **Instant Profile Loading**: Profile pages load immediately with cached vibe checks
2. **Always Fresh Data**: Background refresh ensures data is current
3. **Better UX**: No loading spinners for previously viewed profiles
4. **Offline Support**: Cached vibe checks work without internet
5. **Smart Invalidation**: Cache clears when vibe checks are added/deleted
6. **Smooth Image Transitions**: Images never flicker or disappear during refresh
7. **Local File Support**: Handles both remote URLs and local device files seamlessly

## Image Cache Enhancements

The image cache service has been enhanced to handle both remote URLs and local files, with special integration for Expo's built-in caching system:

### Expo Cache Integration

- **Automatic Detection**: Detects Expo cache files by checking for `ExponentExperienceData` or `Library/Caches` in the path
- **Skip Duplicate Caching**: Treats Expo cached files as already cached, avoiding duplicate work
- **Performance Optimization**: Uses Expo's cache directly instead of copying files
- **Camera Integration**: Works seamlessly with Expo Camera's automatic caching

### Local File Handling

- **Automatic Detection**: Detects local files by checking for `file://` or `/` prefixes
- **File Copying**: Copies local files to cache directory instead of downloading
- **Existence Verification**: Checks if local files exist before processing
- **Error Prevention**: Prevents download errors for local files

### Remote URL Handling

- **Download and Cache**: Downloads remote images and stores them locally
- **Network Optimization**: Limits concurrent downloads to prevent overwhelming
- **Cache Management**: Automatic cleanup and size management

### Code Example

```typescript
// Expo cache file (already cached by Expo)
const expoCacheFile = 'file:///var/mobile/.../ExponentExperienceData/.../Camera/image.jpg';
const cachedPath = await imageCacheService.getCachedImage(expoCacheFile);
// Result: Returns original path, no additional caching needed

// Local file handling
const localImage = 'file:///var/mobile/.../image.jpg';
const cachedPath = await imageCacheService.getCachedImage(localImage);
// Result: Copies local file to cache, returns cached path

// Remote URL handling
const remoteImage = 'https://example.com/image.jpg';
const cachedPath = await imageCacheService.getCachedImage(remoteImage);
// Result: Downloads and caches remote image, returns cached path
```

## Smooth Image Transitions

The implementation ensures that images remain visible and stable during background refreshes:

### Technical Implementation

1. **Smart Update Logic**: The refresh function compares fresh data with current data by ID before updating the UI
2. **React.memo Optimization**: VibeCheckHistoryItem components are wrapped with React.memo to prevent unnecessary re-renders
3. **CachedImage Component**: Uses the existing image caching system to maintain image state
4. **Error Handling**: Network errors don't clear existing vibe checks, maintaining visual continuity

### User Experience

- **No Flickering**: Images stay in place during background refresh
- **Seamless Updates**: New vibe checks appear smoothly without disrupting existing ones
- **Graceful Degradation**: If refresh fails, existing vibe checks remain visible
- **Visual Continuity**: Users can continue browsing while fresh data loads

### Code Example

```typescript
// Smart update logic in ProfileScreen
const hasChanged =
  freshVibeChecks.length !== cloudVibeChecks.length ||
  freshVibeChecks.some((v) => !currentIds.has(v.id)) ||
  cloudVibeChecks.some((v) => !freshIds.has(v.id));

if (hasChanged) {
  // Only update if data actually changed
  setCloudVibeChecks(freshVibeChecks);
} else {
  // Keep existing data, no UI update needed
  console.log('🔄 Fresh data is the same as cached data, no update needed');
}
```

## Configuration

The cache can be configured by modifying the `

## Debug Information

Enable debug logging by checking console output:

- `📸 Image cache service initialized` (only once per app session)
- `📊 Vibe check cache service initialized` (only once per app session)
- `📊 Returning cached vibe checks for user: [userId] ([count] items)`
- `📊 Cached vibe checks for user: [userId] ([count] items, [size]KB)`
- `📊 Invalidated vibe check cache for user: [userId]`
- `🔄 fetchVibeChecksInBackground called with userId: [userId]`
- `🗑️ Vibe check cache cleared`

**Note**: The cache services use initialization guards to prevent multiple simultaneous initializations, so you should only see one initialization message per service per app session.
