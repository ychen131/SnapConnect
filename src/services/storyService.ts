/**
 * @file storyService.ts
 * @description Service functions for story management and operations.
 */
import { supabase } from './supabase';

/**
 * Story data structure
 */
export interface Story {
  id: string;
  user_id: string;
  media_url: string;
  media_type: 'photo' | 'video';
  timer: number;
  is_public: boolean;
  view_count: number;
  created_at: string;
  expires_at: string;
  updated_at: string;
  // Vibe Check metadata
  vibe_check_summary?: string;
  vibe_check_confidence?: number;
  vibe_check_source_url?: string;
  // Computed fields
  user_username: string;
  user_avatar_url?: string;
}

/**
 * Vibe Check metadata for stories
 */
export interface VibeCheckMetadata {
  vibe_check_summary: string;
  vibe_check_confidence: number;
  vibe_check_source_url: string;
}

/**
 * Adds a snap to the user's story
 * @param userId The user's ID
 * @param mediaUrl The URL of the uploaded media
 * @param mediaType The type of media ('photo' or 'video')
 * @param timer Optional timer for photos (1-10 seconds)
 * @param isPublic Whether the story is public (default: true)
 * @param vibeCheckMetadata Optional Vibe Check metadata to include with the story
 * @returns Promise<Story | null> The created story or null if failed
 */
export async function addToStory(
  userId: string,
  mediaUrl: string,
  mediaType: 'photo' | 'video',
  timer?: number,
  isPublic: boolean = true,
  vibeCheckMetadata?: VibeCheckMetadata,
): Promise<Story | null> {
  try {
    // Validate inputs
    if (!userId || !mediaUrl || !mediaType) {
      throw new Error('Invalid inputs: userId, mediaUrl, and mediaType are required');
    }

    // Validate media type
    if (!['photo', 'video'].includes(mediaType)) {
      throw new Error('Invalid media type: must be "photo" or "video"');
    }

    // Validate timer for photos
    if (mediaType === 'photo' && timer !== undefined) {
      if (timer < 1 || timer > 10) {
        throw new Error('Invalid timer: must be between 1 and 10 seconds for photos');
      }
    }

    // Validate media URL format
    if (!mediaUrl.startsWith('http')) {
      throw new Error('Invalid media URL: must be a valid HTTP URL');
    }

    // Prepare story data
    const storyData: any = {
      user_id: userId,
      media_url: mediaUrl,
      media_type: mediaType,
      timer: timer || 3,
      is_public: isPublic,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
    };

    // Add Vibe Check metadata if provided
    if (vibeCheckMetadata) {
      storyData.vibe_check_summary = vibeCheckMetadata.vibe_check_summary;
      storyData.vibe_check_confidence = vibeCheckMetadata.vibe_check_confidence;
      storyData.vibe_check_source_url = vibeCheckMetadata.vibe_check_source_url;

      // Debug: Log Vibe Check metadata being saved
      console.log('🔍 Saving Vibe Check metadata to story:', {
        vibe_check_summary: vibeCheckMetadata.vibe_check_summary,
        vibe_check_confidence: vibeCheckMetadata.vibe_check_confidence,
        vibe_check_source_url: vibeCheckMetadata.vibe_check_source_url,
      });
    }

    console.log('🔍 Inserting story data:', storyData);

    const { data, error } = await supabase.from('stories').insert(storyData).select().single();

    if (error) {
      if (error.code === '23505') {
        // Unique constraint violation
        throw new Error('Story already exists with this content');
      } else if (error.code === '23503') {
        // Foreign key violation
        throw new Error('User not found');
      } else if (error.code === '23514') {
        // Check constraint violation
        throw new Error('Invalid story data');
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new Error('Network error: Please check your connection and try again');
      } else {
        throw new Error(`Database error: ${error.message}`);
      }
    }

    if (!data) {
      throw new Error('Failed to create story: No data returned');
    }

    return data;
  } catch (error) {
    if (error instanceof Error) {
      throw error; // Already has specific message
    } else {
      throw new Error('Unknown error occurred while adding to story');
    }
  }
}

/**
 * Gets all stories for a specific user
 * @param userId The user's ID
 * @param includeExpired Whether to include expired stories (default: false)
 * @returns Promise<Story[]> List of user's stories
 */
export async function getUserStories(
  userId: string,
  includeExpired: boolean = false,
): Promise<Story[]> {
  try {
    let query = supabase
      .from('stories')
      .select(
        `
        *,
        profiles!stories_user_id_fkey(username, avatar_url)
      `,
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (!includeExpired) {
      query = query.gt('expires_at', new Date().toISOString());
    }

    const { data, error } = await query;

    if (error) {
      return [];
    }

    // Debug: Log raw data to see if Vibe Check metadata is present
    console.log('🔍 Raw story data from database:', data);
    if (data && data.length > 0) {
      data.forEach((story: any, i: number) => {
        if (story.vibe_check_summary) {
          console.log(`🔍 Story ${i + 1} has Vibe Check data:`, {
            id: story.id,
            vibe_check_summary: story.vibe_check_summary,
            vibe_check_confidence: story.vibe_check_confidence,
            vibe_check_source_url: story.vibe_check_source_url,
          });
        }
      });
    }

    // Transform the data to include computed fields
    const stories: Story[] = (data || []).map((story: any) => ({
      ...story,
      user_username: story.profiles?.username || 'Unknown User',
      user_avatar_url: story.profiles?.avatar_url,
    }));

    return stories;
  } catch (error) {
    return [];
  }
}

/**
 * Gets all public stories from friends and other users
 * @param currentUserId The current user's ID
 * @param includeExpired Whether to include expired stories (default: false)
 * @returns Promise<Story[]> List of public stories
 */
export async function getPublicStories(
  currentUserId: string,
  includeExpired: boolean = false,
): Promise<Story[]> {
  try {
    let query = supabase
      .from('stories')
      .select(
        `
        *,
        profiles!stories_user_id_fkey(username, avatar_url)
      `,
      )
      .eq('is_public', true)
      .neq('user_id', currentUserId) // Exclude current user's stories
      .order('created_at', { ascending: false });

    if (!includeExpired) {
      query = query.gt('expires_at', new Date().toISOString());
    }

    const { data, error } = await query;

    if (error) {
      return [];
    }

    // Transform the data to include computed fields
    const stories: Story[] = (data || []).map((story: any) => ({
      ...story,
      user_username: story.profiles?.username || 'Unknown User',
      user_avatar_url: story.profiles?.avatar_url,
    }));

    return stories;
  } catch (error) {
    return [];
  }
}

/**
 * Increments the view count for a story
 * @param storyId The story's ID
 * @returns Promise<boolean> Success status
 */
export async function incrementStoryViewCount(storyId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('stories')
      .update({ view_count: supabase.rpc('increment', { row_id: storyId, x: 1 }) })
      .eq('id', storyId);

    return error ? false : true;
  } catch (error) {
    return false;
  }
}

/**
 * Deletes a story
 * @param storyId The story's ID
 * @param userId The user's ID (for authorization)
 * @returns Promise<boolean> Success status
 */
export async function deleteStory(storyId: string, userId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('stories')
      .delete()
      .eq('id', storyId)
      .eq('user_id', userId); // Ensure user can only delete their own stories

    return error ? false : true;
  } catch (error) {
    return false;
  }
}

/**
 * Updates story privacy settings
 * @param storyId The story's ID
 * @param userId The user's ID (for authorization)
 * @param isPublic Whether the story should be public
 * @returns Promise<boolean> Success status
 */
export async function updateStoryPrivacy(
  storyId: string,
  userId: string,
  isPublic: boolean,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('stories')
      .update({ is_public: isPublic })
      .eq('id', storyId)
      .eq('user_id', userId); // Ensure user can only update their own stories

    return error ? false : true;
  } catch (error) {
    return false;
  }
}

/**
 * Fetches friends with at least one active (unexpired) story.
 * @param userId The current user's ID
 * @returns Promise<Array<{ user_id: string, username: string, avatar_url: string, latest_story: Story }>>
 */
export async function getFriendsWithActiveStories(userId: string) {
  try {
    // Join friendships and stories, filter for unexpired stories, group by friend
    const { data, error } = await supabase.rpc('get_friends_with_active_stories', {
      current_user_id: userId,
    });
    // The RPC should return: [{ user_id, username, avatar_url, latest_story: { ... } }]
    if (error) {
      return [];
    }
    return data || [];
  } catch (error) {
    return [];
  }
}
