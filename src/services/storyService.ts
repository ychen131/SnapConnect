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
  // Computed fields
  user_username: string;
  user_avatar_url?: string;
}

/**
 * Adds a snap to the user's story
 * @param userId The user's ID
 * @param mediaUrl The URL of the uploaded media
 * @param mediaType The type of media ('photo' or 'video')
 * @param timer Optional timer for photos (1-10 seconds)
 * @param isPublic Whether the story is public (default: true)
 * @returns Promise<Story | null> The created story or null if failed
 */
export async function addToStory(
  userId: string,
  mediaUrl: string,
  mediaType: 'photo' | 'video',
  timer?: number,
  isPublic: boolean = true,
): Promise<Story | null> {
  try {
    // Validate inputs
    if (!userId || !mediaUrl || !mediaType) {
      console.error('Invalid inputs for addToStory:', { userId, mediaUrl, mediaType });
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

    console.log('📖 Adding to story:', { userId, mediaUrl, mediaType, timer, isPublic });

    const { data, error } = await supabase
      .from('stories')
      .insert({
        user_id: userId,
        media_url: mediaUrl,
        media_type: mediaType,
        timer: timer || 3,
        is_public: isPublic,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
      })
      .select()
      .single();

    if (error) {
      console.error('Database error adding to story:', error);

      // Provide specific error messages based on error type
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

    console.log('✅ Story added successfully:', data);
    return data;
  } catch (error) {
    console.error('Error adding to story:', error);

    // Re-throw with more specific error messages
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
    console.log('📖 Getting stories for user:', userId);

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
      console.error('Error getting user stories:', error);
      return [];
    }

    // Transform the data to include computed fields
    const stories: Story[] = (data || []).map((story: any) => ({
      ...story,
      user_username: story.profiles?.username || 'Unknown User',
      user_avatar_url: story.profiles?.avatar_url,
    }));

    console.log(`Found ${stories.length} stories for user ${userId}`);
    return stories;
  } catch (error) {
    console.error('Error getting user stories:', error);
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
    console.log('📖 Getting public stories for user:', currentUserId);

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
      console.error('Error getting public stories:', error);
      return [];
    }

    // Transform the data to include computed fields
    const stories: Story[] = (data || []).map((story: any) => ({
      ...story,
      user_username: story.profiles?.username || 'Unknown User',
      user_avatar_url: story.profiles?.avatar_url,
    }));

    console.log(`Found ${stories.length} public stories`);
    return stories;
  } catch (error) {
    console.error('Error getting public stories:', error);
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

    if (error) {
      console.error('Error incrementing story view count:', error);
      return false;
    }

    console.log('✅ Story view count incremented for:', storyId);
    return true;
  } catch (error) {
    console.error('Error incrementing story view count:', error);
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

    if (error) {
      console.error('Error deleting story:', error);
      return false;
    }

    console.log('✅ Story deleted:', storyId);
    return true;
  } catch (error) {
    console.error('Error deleting story:', error);
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

    if (error) {
      console.error('Error updating story privacy:', error);
      return false;
    }

    console.log('✅ Story privacy updated:', { storyId, isPublic });
    return true;
  } catch (error) {
    console.error('Error updating story privacy:', error);
    return false;
  }
}
