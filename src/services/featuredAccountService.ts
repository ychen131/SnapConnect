/**
 * @file featuredAccountService.ts
 * @description Service functions for managing featured accounts and their stories.
 */
import { supabase } from './supabase';

export interface FeaturedAccount {
  user_id: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  is_featured: boolean;
  story_count: number;
  latest_story_created_at: string | null;
}

export interface FeaturedAccountWithStories extends FeaturedAccount {
  stories?: Array<{
    id: string;
    media_url: string;
    media_type: 'photo' | 'video';
    created_at: string;
    vibe_check_summary?: string;
  }>;
}

/**
 * Retrieves all featured accounts with their story information.
 * @returns Promise<FeaturedAccount[]> - Array of featured accounts
 */
export async function getFeaturedAccounts(): Promise<FeaturedAccount[]> {
  try {
    const { data, error } = await supabase.rpc('get_featured_accounts_with_stories');

    if (error) {
      console.error('Error fetching featured accounts:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getFeaturedAccounts:', error);
    throw error;
  }
}

/**
 * Retrieves featured accounts using the database view for simpler queries.
 * @returns Promise<FeaturedAccount[]> - Array of featured accounts
 */
export async function getFeaturedAccountsSimple(): Promise<FeaturedAccount[]> {
  try {
    const { data, error } = await supabase
      .from('featured_accounts_view')
      .select('*')
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching featured accounts:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getFeaturedAccountsSimple:', error);
    throw error;
  }
}

/**
 * Retrieves a specific featured account by user ID.
 * @param userId The user ID to fetch
 * @returns Promise<FeaturedAccount | null> - Featured account data or null if not found
 */
export async function getFeaturedAccountById(userId: string): Promise<FeaturedAccount | null> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(
        `
        id,
        username,
        avatar_url,
        bio,
        is_featured,
        updated_at
      `,
      )
      .eq('id', userId)
      .eq('is_featured', true)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Not found
        return null;
      }
      console.error('Error fetching featured account by ID:', error);
      throw error;
    }

    if (!data) return null;

    // Get story count for this user
    const { count: storyCount } = await supabase
      .from('stories')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gt('expires_at', new Date().toISOString())
      .eq('is_public', true);

    return {
      user_id: data.id,
      username: data.username,
      avatar_url: data.avatar_url,
      bio: data.bio,
      is_featured: data.is_featured,
      story_count: storyCount || 0,
      latest_story_created_at: null, // Would need additional query to get this
    };
  } catch (error) {
    console.error('Error in getFeaturedAccountById:', error);
    throw error;
  }
}

/**
 * Retrieves featured accounts that have active stories.
 * @returns Promise<FeaturedAccount[]> - Array of featured accounts with active stories
 */
export async function getFeaturedAccountsWithActiveStories(): Promise<FeaturedAccount[]> {
  try {
    const { data, error } = await supabase.rpc('get_featured_accounts_with_stories');

    if (error) {
      console.error('Error fetching featured accounts with stories:', error);
      throw error;
    }

    // Filter to only include accounts with active stories
    return (data || []).filter((account: FeaturedAccount) => account.story_count > 0);
  } catch (error) {
    console.error('Error in getFeaturedAccountsWithActiveStories:', error);
    throw error;
  }
}

/**
 * Checks if a user is a featured account.
 * @param userId The user ID to check
 * @returns Promise<boolean> - True if user is featured, false otherwise
 */
export async function isUserFeatured(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('is_featured')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error checking if user is featured:', error);
      return false;
    }

    return data?.is_featured || false;
  } catch (error) {
    console.error('Error in isUserFeatured:', error);
    return false;
  }
}

/**
 * Updates a user's featured status (admin function).
 * @param userId The user ID to update
 * @param isFeatured Whether the user should be featured
 * @returns Promise<boolean> - True if update was successful
 */
export async function updateFeaturedStatus(userId: string, isFeatured: boolean): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ is_featured: isFeatured })
      .eq('id', userId);

    if (error) {
      console.error('Error updating featured status:', error);
      throw error;
    }

    return true;
  } catch (error) {
    console.error('Error in updateFeaturedStatus:', error);
    throw error;
  }
}
