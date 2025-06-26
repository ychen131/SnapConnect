/**
 * @file realtimeService.ts
 * @description Service for managing realtime subscriptions with Redux integration.
 */
import { store } from '../store/store';
import {
  setConnectionStatus,
  addActiveSubscription,
  removeActiveSubscription,
  clearActiveSubscriptions,
  addNewMessageNotification,
  addNewSnapNotification,
  addNewStoryNotification,
  setError,
  clearSnapNotification as clearSnapNotificationAction,
  clearAllSnapNotifications as clearAllSnapNotificationsAction,
  clearAllMessageNotifications as clearAllMessageNotificationsAction,
  clearMessageNotification as clearMessageNotificationAction,
  clearStoryNotification as clearStoryNotificationAction,
  clearAllStoryNotifications as clearAllStoryNotificationsAction,
} from '../store/realtimeSlice';
import {
  subscribeToAllMessages,
  unsubscribeFromAllMessages,
  subscribeToStories,
  unsubscribeFromStories,
} from './realtime';
import { getConversations } from './chatService';
import { getUserProfile } from './userService';
import { getFriendsWithActiveStories } from './storyService';
import { getFriendsList } from './friendService';
import { supabase } from './supabase';

let isInitialized = false;

/**
 * Initialize realtime subscriptions for the current user.
 * @param userId The current user's ID
 */
export async function initializeRealtimeSubscriptions(userId: string): Promise<void> {
  try {
    if (isInitialized) {
      console.log('🔄 Realtime already initialized, reinitializing...');
      cleanupRealtimeSubscriptions();
    }

    console.log('🚀 Initializing realtime subscriptions for user:', userId);

    // Subscribe to all messages (text, photo, video) using single channel
    subscribeToAllMessages(
      userId,
      (payload) => {
        handleNewMessage(payload);
      },
      (payload) => {
        handleNewSnap(payload);
      },
    );

    // Subscribe to story updates
    subscribeToStories(
      userId,
      (payload) => {
        handleNewStory(payload);
      },
      (payload) => {
        handleStoryUpdate(payload);
      },
    );

    // Update Redux state
    store.dispatch(setConnectionStatus(true));
    store.dispatch(addActiveSubscription('messages'));
    store.dispatch(addActiveSubscription('snaps'));
    store.dispatch(addActiveSubscription('stories'));
    store.dispatch(setError(null));

    isInitialized = true;
    console.log('✅ Realtime subscriptions initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing realtime subscriptions:', error);
    store.dispatch(setError(error instanceof Error ? error.message : 'Unknown error'));
    store.dispatch(setConnectionStatus(false));
  }
}

/**
 * Clean up all realtime subscriptions.
 */
export function cleanupRealtimeSubscriptions(): void {
  try {
    console.log('🧹 Cleaning up realtime subscriptions...');

    // Unsubscribe from all channels
    unsubscribeFromAllMessages();
    unsubscribeFromStories();

    // Update Redux state
    store.dispatch(setConnectionStatus(false));
    store.dispatch(clearActiveSubscriptions());

    isInitialized = false;
    console.log('✅ Realtime subscriptions cleaned up successfully');
  } catch (error) {
    console.error('❌ Error cleaning up realtime subscriptions:', error);
  }
}

/**
 * Handle new message events from realtime subscriptions.
 * @param payload The message payload from Supabase
 */
async function handleNewMessage(payload: any): Promise<void> {
  try {
    console.log('📨 New message received:', payload);

    if (payload.eventType !== 'INSERT') {
      return;
    }

    const newMessage = payload.new;
    if (!newMessage) {
      console.warn('⚠️ No message data in payload');
      return;
    }

    // Add notification to Redux state
    store.dispatch(
      addNewMessageNotification({
        conversationId: newMessage.conversation_id,
        messageAt: newMessage.created_at,
      }),
    );

    console.log('✅ Message notification added for conversation:', newMessage.conversation_id);
    console.log(
      '🔴 Current message notifications count:',
      store.getState().realtime.newMessageNotifications.length,
    );

    // Optionally refresh conversations list
    const state = store.getState();
    const currentUserId = state.auth.user?.id;
    if (currentUserId) {
      // Refresh conversations in background (don't await to avoid blocking)
      getConversations(currentUserId).catch((error) => {
        console.error('Error refreshing conversations after new message:', error);
      });
    }
  } catch (error) {
    console.error('❌ Error handling new message:', error);
  }
}

/**
 * Handle new snap events from realtime subscriptions.
 * @param payload The snap payload from Supabase
 */
async function handleNewSnap(payload: any): Promise<void> {
  try {
    console.log('📸 New snap received:', payload);

    if (payload.eventType !== 'INSERT') {
      return;
    }

    const newSnap = payload.new;
    if (!newSnap) {
      console.warn('⚠️ No snap data in payload');
      return;
    }

    // Only handle photo/video messages (snaps)
    if (newSnap.message_type !== 'photo' && newSnap.message_type !== 'video') {
      return;
    }

    // Get sender username for notification
    let senderUsername = 'Unknown User';
    try {
      const { data: sender } = await getUserProfile(newSnap.sender_id);
      if (sender) {
        senderUsername = sender.username || 'Unknown User';
      }
    } catch (error) {
      console.error('Error fetching sender username:', error);
    }

    // Add snap notification to Redux state
    store.dispatch(
      addNewSnapNotification({
        senderId: newSnap.sender_id,
        senderUsername,
        snapId: newSnap.id,
        mediaType: newSnap.message_type as 'photo' | 'video',
        timer: newSnap.timer,
        receivedAt: newSnap.created_at,
      }),
    );

    console.log('✅ Snap notification added for:', senderUsername);
    console.log(
      '🔴 Current snap notifications count:',
      store.getState().realtime.newSnapNotifications.length,
    );
  } catch (error) {
    console.error('❌ Error handling new snap:', error);
  }
}

/**
 * Handle new story events from realtime subscriptions.
 * @param payload The story payload from Supabase
 */
async function handleNewStory(payload: any): Promise<void> {
  try {
    console.log('�� New story received via realtime:', payload);

    if (payload.eventType !== 'INSERT') {
      console.log('📖 Not an INSERT event, skipping');
      return;
    }

    const newStory = payload.new;
    if (!newStory) {
      console.warn('⚠️ No story data in payload');
      return;
    }

    console.log('📖 Processing story from user:', newStory.user_id);

    // Get story creator username for notification
    let username = 'Unknown User';
    try {
      const { data: creator } = await getUserProfile(newStory.user_id);
      if (creator) {
        username = creator.username || 'Unknown User';
      }
    } catch (error) {
      console.error('Error fetching story creator username:', error);
    }

    // Check if the story creator is a friend before adding notification
    const state = store.getState();
    const currentUserId = state.auth.user?.id;
    if (!currentUserId) {
      console.warn('⚠️ No current user ID available');
      return;
    }

    console.log('📖 Checking if story creator is a friend...');

    try {
      // Get friends list to check if story creator is a friend
      const friends = await getFriendsList(currentUserId);
      const isFriend = friends.some((friend: any) => friend.id === newStory.user_id);

      console.log(
        '📖 Friends list:',
        friends.map((f: any) => f.id),
      );
      console.log('📖 Story creator ID:', newStory.user_id);
      console.log('📖 Is friend?', isFriend);

      if (!isFriend) {
        console.log('📖 Story creator is not a friend, skipping notification:', username);
        return;
      }

      console.log('📖 Story creator is a friend, adding notification:', username);
    } catch (error) {
      console.error('Error checking friend relationship:', error);
      // If we can't check friend relationship, don't add notification to be safe
      return;
    }

    // Add story notification to Redux state
    store.dispatch(
      addNewStoryNotification({
        storyId: newStory.id,
        userId: newStory.user_id,
        username,
        mediaType: newStory.media_type as 'photo' | 'video',
        receivedAt: newStory.created_at,
      }),
    );

    console.log('✅ Story notification added for:', username);
    console.log(
      '🔴 Current story notifications count:',
      store.getState().realtime.newStoryNotifications.length,
    );
  } catch (error) {
    console.error('❌ Error handling new story:', error);
  }
}

/**
 * Handle story update events from realtime subscriptions.
 * @param payload The story update payload from Supabase
 */
async function handleStoryUpdate(payload: any): Promise<void> {
  try {
    console.log('📖 Story update received:', payload);

    // Handle story updates (expiration, deletion, etc.)
    // For now, we'll just log the update
    // In the future, we could refresh the stories list or handle specific updates

    const state = store.getState();
    const currentUserId = state.auth.user?.id;
    if (currentUserId) {
      // Optionally refresh stories list in background
      // This could be optimized to only refresh when needed
      console.log('🔄 Story update detected, stories list may need refresh');
    }
  } catch (error) {
    console.error('❌ Error handling story update:', error);
  }
}

/**
 * Get the current realtime connection status.
 * @returns boolean indicating if connected
 */
export function getConnectionStatus(): boolean {
  const state = store.getState();
  return state.realtime.isConnected;
}

/**
 * Get unread message counts for conversations.
 * @returns Array of conversation notifications
 */
export function getMessageNotifications() {
  const state = store.getState();
  return state.realtime.newMessageNotifications;
}

/**
 * Get new snap notifications.
 * @returns Array of snap notifications
 */
export function getSnapNotifications() {
  const state = store.getState();
  return state.realtime.newSnapNotifications;
}

/**
 * Get new story notifications.
 * @returns Array of story notifications
 */
export function getStoryNotifications() {
  const state = store.getState();
  return state.realtime.newStoryNotifications;
}

/**
 * Clear notifications for a specific conversation.
 * @param conversationId The conversation ID
 */
export function clearConversationNotifications(conversationId: string): void {
  store.dispatch(removeActiveSubscription(conversationId));
}

/**
 * Clear message notifications for a specific conversation.
 * @param conversationId The conversation ID
 */
export function clearMessageNotification(conversationId: string): void {
  console.log('🧹 Clearing message notifications for conversation:', conversationId);
  store.dispatch(clearMessageNotificationAction(conversationId));
  console.log(
    '🔴 Remaining message notifications count:',
    store.getState().realtime.newMessageNotifications.length,
  );
}

/**
 * Clear a specific snap notification.
 * @param snapId The snap ID
 */
export function clearSnapNotification(snapId: string): void {
  console.log('🧹 Clearing snap notification for snapId:', snapId);
  store.dispatch(clearSnapNotificationAction(snapId));
  console.log(
    '🔴 Remaining snap notifications count:',
    store.getState().realtime.newSnapNotifications.length,
  );
}

/**
 * Clear a specific story notification.
 * @param storyId The story ID
 */
export function clearStoryNotification(storyId: string): void {
  console.log('🧹 Clearing story notification for storyId:', storyId);
  store.dispatch(clearStoryNotificationAction(storyId));
  console.log(
    '🔴 Remaining story notifications count:',
    store.getState().realtime.newStoryNotifications.length,
  );
}

/**
 * Clear all snap notifications.
 */
export function clearAllSnapNotifications(): void {
  console.log('🧹 Clearing all snap notifications');
  store.dispatch(clearAllSnapNotificationsAction());
  console.log(
    '🔴 Snap notifications count after clearing all:',
    store.getState().realtime.newSnapNotifications.length,
  );
}

/**
 * Clear all message notifications.
 */
export function clearAllMessageNotifications(): void {
  console.log('🧹 Clearing all message notifications');
  store.dispatch(clearAllMessageNotificationsAction());
  console.log(
    '🔴 Message notifications count after clearing all:',
    store.getState().realtime.newMessageNotifications.length,
  );
}

/**
 * Clear all story notifications.
 */
export function clearAllStoryNotifications(): void {
  console.log('🧹 Clearing all story notifications');
  store.dispatch(clearAllStoryNotificationsAction());
  console.log(
    '🔴 Story notifications count after clearing all:',
    store.getState().realtime.newStoryNotifications.length,
  );
}

/**
 * Clear all notifications (snaps, messages, and stories).
 */
export function clearAllNotifications(): void {
  console.log('🧹 Clearing all notifications (snaps, messages, and stories)');
  store.dispatch(clearAllSnapNotificationsAction());
  store.dispatch(clearAllMessageNotificationsAction());
  store.dispatch(clearAllStoryNotificationsAction());
  console.log(
    '🔴 Notifications count after clearing all:',
    'Snaps:',
    store.getState().realtime.newSnapNotifications.length,
    'Messages:',
    store.getState().realtime.newMessageNotifications.length,
    'Stories:',
    store.getState().realtime.newStoryNotifications.length,
  );
}
