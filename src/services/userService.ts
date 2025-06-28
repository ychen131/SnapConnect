/**
 * @file userService.ts
 * @description Service functions for user profile management and validation.
 */
import { supabase } from './supabase';

/**
 * Checks if a username is already taken by another user.
 * @param username The username to check
 * @returns Promise<boolean> - true if username is available, false if taken
 */
export async function checkUsernameAvailability(username: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username.toLowerCase())
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "not found" error, which means username is available
      console.error('Error checking username availability:', error);
      return false;
    }

    // If data exists, username is taken
    return !data;
  } catch (error) {
    console.error('Error checking username availability:', error);
    return false;
  }
}

/**
 * Creates or updates a user profile with additional information.
 * @param userId The user's ID from auth
 * @param profileData The profile data to save
 */
export async function upsertUserProfile(
  userId: string,
  profileData: {
    username: string;
    bio?: string;
    avatar_url?: string;
    email?: string;
    dateOfBirth?: string;
  },
) {
  try {
    const upsertData: any = {
      id: userId,
      username: profileData.username.toLowerCase(),
      updated_at: new Date().toISOString(),
    };
    if (profileData.bio !== undefined) upsertData.bio = profileData.bio;
    if (profileData.avatar_url !== undefined) upsertData.avatar_url = profileData.avatar_url;
    if (profileData.email !== undefined) upsertData.email = profileData.email;
    if (profileData.dateOfBirth !== undefined) upsertData.date_of_birth = profileData.dateOfBirth;

    const { data, error } = await supabase.from('profiles').upsert(upsertData).select().single();

    if (error) {
      console.error('Error upserting user profile:', error);
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error upserting user profile:', error);
    return { data: null, error };
  }
}

/**
 * Gets a user profile by user ID.
 * @param userId The user's ID
 */
export async function getUserProfile(userId: string) {
  try {
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

    if (error) {
      console.error('Error getting user profile:', error);
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return { data: null, error };
  }
}
