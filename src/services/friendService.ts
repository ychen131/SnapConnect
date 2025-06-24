/**
 * @file friendService.ts
 * @description Service functions for friend management and friend list operations.
 */
import { supabase } from './supabase';

/**
 * Friend relationship status
 */
export type FriendStatus = 'pending' | 'accepted' | 'blocked';

/**
 * Friend data structure
 */
export interface Friend {
  id: string;
  username: string;
  avatar_url?: string;
  status: FriendStatus;
  created_at: string;
}

/**
 * Gets the current user's friends list
 * @param userId The current user's ID
 * @returns Promise<Friend[]> List of friends
 */
export async function getFriendsList(userId: string): Promise<Friend[]> {
  try {
    // For MVP, we'll use a simple approach - get all users except the current user
    // In a real app, this would query a friends table with proper relationships
    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, created_at')
      .neq('id', userId)
      .limit(20); // Limit for performance

    if (error) {
      console.error('Error fetching friends list:', error);
      return [];
    }

    // Transform to Friend interface with mock status
    const friends: Friend[] = (data || []).map((profile) => ({
      id: profile.id,
      username: profile.username,
      avatar_url: profile.avatar_url,
      status: 'accepted' as FriendStatus, // Mock status for MVP
      created_at: profile.created_at,
    }));

    return friends;
  } catch (error) {
    console.error('Error in getFriendsList:', error);
    return [];
  }
}

/**
 * Searches for users by username
 * @param searchTerm The search term
 * @param currentUserId The current user's ID (to exclude from results)
 * @returns Promise<Friend[]> List of matching users
 */
export async function searchUsers(searchTerm: string, currentUserId: string): Promise<Friend[]> {
  try {
    if (!searchTerm || searchTerm.length < 2) {
      return [];
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, created_at')
      .neq('id', currentUserId)
      .ilike('username', `%${searchTerm}%`)
      .limit(10);

    if (error) {
      console.error('Error searching users:', error);
      return [];
    }

    // Transform to Friend interface
    const users: Friend[] = (data || []).map((profile) => ({
      id: profile.id,
      username: profile.username,
      avatar_url: profile.avatar_url,
      status: 'pending' as FriendStatus, // Mock status for MVP
      created_at: profile.created_at,
    }));

    return users;
  } catch (error) {
    console.error('Error in searchUsers:', error);
    return [];
  }
}

/**
 * Sends a friend request
 * @param fromUserId The sender's user ID
 * @param toUserId The recipient's user ID
 * @returns Promise<boolean> Success status
 */
export async function sendFriendRequest(fromUserId: string, toUserId: string): Promise<boolean> {
  try {
    // For MVP, we'll just return success
    // In a real app, this would insert into a friend_requests table
    console.log(`Friend request sent from ${fromUserId} to ${toUserId}`);
    return true;
  } catch (error) {
    console.error('Error sending friend request:', error);
    return false;
  }
}

/**
 * Accepts a friend request
 * @param fromUserId The sender's user ID
 * @param toUserId The recipient's user ID
 * @returns Promise<boolean> Success status
 */
export async function acceptFriendRequest(fromUserId: string, toUserId: string): Promise<boolean> {
  try {
    // For MVP, we'll just return success
    // In a real app, this would update the friend_requests table
    console.log(`Friend request accepted from ${fromUserId} to ${toUserId}`);
    return true;
  } catch (error) {
    console.error('Error accepting friend request:', error);
    return false;
  }
}
