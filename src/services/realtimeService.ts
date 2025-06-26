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
  setError,
} from '../store/realtimeSlice';
import {
  subscribeToNewMessages,
  unsubscribeFromNewMessages,
  subscribeToNewSnaps,
  unsubscribeFromNewSnaps,
} from './realtime';
import { getConversations } from './chatService';
import { getUserProfile } from './userService';

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

    // Subscribe to new messages
    subscribeToNewMessages(userId, (payload) => {
      handleNewMessage(payload);
    });

    // Subscribe to new snaps
    subscribeToNewSnaps(userId, (payload) => {
      handleNewSnap(payload);
    });

    // Update Redux state
    store.dispatch(setConnectionStatus(true));
    store.dispatch(addActiveSubscription('messages'));
    store.dispatch(addActiveSubscription('snaps'));
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
    unsubscribeFromNewMessages();
    unsubscribeFromNewSnaps();

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
  } catch (error) {
    console.error('❌ Error handling new snap:', error);
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
 * Clear notifications for a specific conversation.
 * @param conversationId The conversation ID
 */
export function clearConversationNotifications(conversationId: string): void {
  store.dispatch(removeActiveSubscription(conversationId));
}

/**
 * Clear a specific snap notification.
 * @param snapId The snap ID
 */
export function clearSnapNotification(snapId: string): void {
  store.dispatch(removeActiveSubscription(snapId));
}
