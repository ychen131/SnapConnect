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
    // Get friends from the friendships table using table aliases for both profile joins
    const { data, error } = await supabase
      .from('friendships')
      .select(
        `
        user1_id,
        user2_id,
        user1:profiles!friendships_user1_id_fkey(id, username, avatar_url, created_at),
        user2:profiles!friendships_user2_id_fkey(id, username, avatar_url, created_at)
      `,
      )
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

    if (error) {
      console.error('Error fetching friends list:', error);
      return [];
    }

    // Transform the data to include the friend's profile (not the current user's)
    const friends: Friend[] = (data || []).map((friendship: any) => {
      const isUser1 = friendship.user1_id === userId;
      const friendProfile = isUser1 ? friendship.user2 : friendship.user1;
      return {
        id: friendProfile?.id || (isUser1 ? friendship.user2_id : friendship.user1_id),
        username: friendProfile?.username || 'Unknown User',
        avatar_url: friendProfile?.avatar_url,
        status: 'accepted' as FriendStatus,
        created_at: friendProfile?.created_at || new Date().toISOString(),
      };
    });

    console.log(`Found ${friends.length} friends for user ${userId}`);
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

    // Get all users matching the search term
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, username, avatar_url, created_at')
      .neq('id', currentUserId)
      .ilike('username', `%${searchTerm}%`)
      .limit(10);

    if (usersError) {
      console.error('Error searching users:', usersError);
      return [];
    }

    if (!users || users.length === 0) {
      return [];
    }

    // Get existing friendships for the current user
    const { data: friendships, error: friendshipsError } = await supabase
      .from('friendships')
      .select('user1_id, user2_id')
      .or(`user1_id.eq.${currentUserId},user2_id.eq.${currentUserId}`);

    if (friendshipsError) {
      console.error('Error fetching friendships:', friendshipsError);
    }

    // Get existing friend requests for the current user
    const { data: friendRequests, error: requestsError } = await supabase
      .from('friend_requests')
      .select('from_user_id, to_user_id, status')
      .or(`from_user_id.eq.${currentUserId},to_user_id.eq.${currentUserId}`);

    if (requestsError) {
      console.error('Error fetching friend requests:', requestsError);
    }

    // Create sets for faster lookup
    const friendIds = new Set<string>();
    const pendingRequestIds = new Set<string>();
    const sentRequestIds = new Set<string>();

    // Add friend IDs
    (friendships || []).forEach((friendship: any) => {
      const friendId =
        friendship.user1_id === currentUserId ? friendship.user2_id : friendship.user1_id;
      friendIds.add(friendId);
    });

    // Add request IDs
    (friendRequests || []).forEach((request: any) => {
      if (request.status === 'pending') {
        if (request.from_user_id === currentUserId) {
          sentRequestIds.add(request.to_user_id);
        } else {
          pendingRequestIds.add(request.from_user_id);
        }
      }
    });

    // Filter out users who are already friends or have pending requests
    const filteredUsers = users.filter((user) => {
      return (
        !friendIds.has(user.id) && !pendingRequestIds.has(user.id) && !sentRequestIds.has(user.id)
      );
    });

    // Transform to Friend interface
    const results: Friend[] = filteredUsers.map((profile) => ({
      id: profile.id,
      username: profile.username,
      avatar_url: profile.avatar_url,
      status: 'pending' as FriendStatus, // This means they can be added as friend
      created_at: profile.created_at,
    }));

    console.log(
      `Found ${results.length} users matching "${searchTerm}" (excluding friends and existing requests)`,
    );
    return results;
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
    // Check if a friend request already exists
    const { data: existingRequest, error: checkError } = await supabase
      .from('friend_requests')
      .select('id, status')
      .or(
        `and(from_user_id.eq.${fromUserId},to_user_id.eq.${toUserId}),and(from_user_id.eq.${toUserId},to_user_id.eq.${fromUserId})`,
      )
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing friend request:', checkError);
      return false;
    }

    // If request already exists, don't create a duplicate
    if (existingRequest) {
      console.log('Friend request already exists:', existingRequest);
      return false;
    }

    // Create new friend request
    const { error } = await supabase.from('friend_requests').insert({
      from_user_id: fromUserId,
      to_user_id: toUserId,
      status: 'pending',
    });

    if (error) {
      console.error('Error sending friend request:', error);
      return false;
    }

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
    // Update the friend request status to accepted
    const { error: updateError } = await supabase
      .from('friend_requests')
      .update({ status: 'accepted', updated_at: new Date().toISOString() })
      .eq('from_user_id', fromUserId)
      .eq('to_user_id', toUserId)
      .eq('status', 'pending');

    if (updateError) {
      console.error('Error accepting friend request:', updateError);
      return false;
    }

    // Create a friendship record (optional - for easier querying)
    const { error: friendshipError } = await supabase.from('friendships').insert({
      user1_id: fromUserId,
      user2_id: toUserId,
      created_at: new Date().toISOString(),
    });

    if (friendshipError) {
      console.error('Error creating friendship record:', friendshipError);
      // Don't fail the whole operation if friendship record creation fails
    }

    console.log(`Friend request accepted from ${fromUserId} to ${toUserId}`);
    return true;
  } catch (error) {
    console.error('Error accepting friend request:', error);
    return false;
  }
}

/**
 * Declines a friend request
 * @param fromUserId The sender's user ID
 * @param toUserId The recipient's user ID
 * @returns Promise<boolean> Success status
 */
export async function declineFriendRequest(fromUserId: string, toUserId: string): Promise<boolean> {
  try {
    // Update the friend request status to declined
    const { error } = await supabase
      .from('friend_requests')
      .update({ status: 'declined', updated_at: new Date().toISOString() })
      .eq('from_user_id', fromUserId)
      .eq('to_user_id', toUserId)
      .eq('status', 'pending');

    if (error) {
      console.error('Error declining friend request:', error);
      return false;
    }

    console.log(`Friend request declined from ${fromUserId} to ${toUserId}`);
    return true;
  } catch (error) {
    console.error('Error declining friend request:', error);
    return false;
  }
}

/**
 * Gets pending friend requests for a user
 * @param userId The current user's ID
 * @returns Promise<Friend[]> List of pending friend requests
 */
export async function getPendingRequests(userId: string): Promise<Friend[]> {
  try {
    const { data, error } = await supabase
      .from('friend_requests')
      .select(
        `
        from_user_id,
        profiles!friend_requests_from_user_id_fkey(
          id,
          username,
          avatar_url,
          created_at
        )
      `,
      )
      .eq('to_user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error getting pending requests:', error);
      return [];
    }

    // Transform the data to match Friend interface
    const requests: Friend[] = (data || []).map((request: any) => ({
      id: request.from_user_id,
      username: request.profiles?.username || 'Unknown User',
      avatar_url: request.profiles?.avatar_url,
      status: 'pending' as FriendStatus,
      created_at: request.profiles?.created_at || new Date().toISOString(),
    }));

    console.log(`Found ${requests.length} pending requests for user ${userId}`);
    return requests;
  } catch (error) {
    console.error('Error getting pending requests:', error);
    return [];
  }
}
