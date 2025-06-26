/**
 * @file realtime.ts
 * @description Service for managing Supabase Realtime subscriptions (chat messages, snaps, stories, etc).
 */
import { supabase } from './supabase';

let messageChannel: any = null;
let storyChannel: any = null;

/**
 * Subscribe to all new messages (text, photo, video) for the current user.
 * @param userId The current user's ID
 * @param onNewMessage Callback for new text message events
 * @param onNewSnap Callback for new snap events (photo/video)
 */
export function subscribeToAllMessages(
  userId: string,
  onNewMessage: (payload: any) => void,
  onNewSnap: (payload: any) => void,
) {
  if (messageChannel) {
    messageChannel.unsubscribe();
    messageChannel = null;
  }
  messageChannel = supabase
    .channel('messages-realtime')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `recipient_id=eq.${userId}`,
      },
      (payload: any) => {
        console.log('📨 New message received via realtime:', payload);

        // Route based on message_type
        if (payload.new?.message_type === 'text') {
          console.log('📝 Routing to text message handler');
          onNewMessage(payload);
        } else if (payload.new?.message_type === 'photo' || payload.new?.message_type === 'video') {
          console.log('📸 Routing to snap handler');
          onNewSnap(payload);
        } else {
          console.log('❓ Unknown message type:', payload.new?.message_type);
        }
      },
    )
    .subscribe((status: any) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Subscribed to all messages for user', userId);
      }
    });
}

/**
 * Subscribe to story updates for the current user and their friends.
 * @param userId The current user's ID
 * @param onNewStory Callback for new story events
 * @param onStoryUpdate Callback for story update events (expiration, deletion, etc.)
 */
export function subscribeToStories(
  userId: string,
  onNewStory: (payload: any) => void,
  onStoryUpdate: (payload: any) => void,
) {
  if (storyChannel) {
    console.log('📖 Unsubscribing from existing story channel');
    storyChannel.unsubscribe();
    storyChannel = null;
  }

  console.log('📖 Setting up story subscription for user:', userId);
  console.log('📖 Supabase client:', supabase);

  storyChannel = supabase
    .channel('stories-realtime')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'stories',
        filter: `is_public=eq.true`,
      },
      (payload: any) => {
        // Only handle stories from other users (not the current user)
        if (payload.new?.user_id !== userId) {
          onNewStory(payload);
        }
      },
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'stories',
      },
      (payload: any) => {
        onStoryUpdate(payload);
      },
    )
    .on(
      'postgres_changes',
      {
        event: 'DELETE',
        schema: 'public',
        table: 'stories',
      },
      (payload: any) => {
        onStoryUpdate(payload);
      },
    )
    .subscribe();
}

/**
 * Unsubscribe from all message realtime events.
 */
export function unsubscribeFromAllMessages() {
  if (messageChannel) {
    messageChannel.unsubscribe();
    messageChannel = null;
    console.log('🛑 Unsubscribed from all messages');
  }
}

/**
 * Unsubscribe from all story realtime events.
 */
export function unsubscribeFromStories() {
  if (storyChannel) {
    storyChannel.unsubscribe();
    storyChannel = null;
    console.log('🛑 Unsubscribed from all stories');
  }
}

// Legacy functions for backward compatibility
/**
 * Subscribe to new chat messages for the current user.
 * @param userId The current user's ID
 * @param onNewMessage Callback for new message events
 * @deprecated Use subscribeToAllMessages instead
 */
export function subscribeToNewMessages(userId: string, onNewMessage: (payload: any) => void) {
  console.warn('⚠️ subscribeToNewMessages is deprecated. Use subscribeToAllMessages instead.');
  subscribeToAllMessages(userId, onNewMessage, () => {});
}

/**
 * Subscribe to new snap deliveries for the current user.
 * @param userId The current user's ID
 * @param onNewSnap Callback for new snap events
 * @deprecated Use subscribeToAllMessages instead
 */
export function subscribeToNewSnaps(userId: string, onNewSnap: (payload: any) => void) {
  console.warn('⚠️ subscribeToNewSnaps is deprecated. Use subscribeToAllMessages instead.');
  subscribeToAllMessages(userId, () => {}, onNewSnap);
}

/**
 * Unsubscribe from chat message realtime events.
 * @deprecated Use unsubscribeFromAllMessages instead
 */
export function unsubscribeFromNewMessages() {
  console.warn(
    '⚠️ unsubscribeFromNewMessages is deprecated. Use unsubscribeFromAllMessages instead.',
  );
  unsubscribeFromAllMessages();
}

/**
 * Unsubscribe from snap delivery realtime events.
 * @deprecated Use unsubscribeFromAllMessages instead
 */
export function unsubscribeFromNewSnaps() {
  console.warn('⚠️ unsubscribeFromNewSnaps is deprecated. Use unsubscribeFromAllMessages instead.');
  unsubscribeFromAllMessages();
}
