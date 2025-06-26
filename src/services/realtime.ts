/**
 * @file realtime.ts
 * @description Service for managing Supabase Realtime subscriptions (chat messages, snaps, etc).
 */
import { supabase } from './supabase';

let messageChannel: any = null;

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
 * Unsubscribe from all message realtime events.
 */
export function unsubscribeFromAllMessages() {
  if (messageChannel) {
    messageChannel.unsubscribe();
    messageChannel = null;
    console.log('🛑 Unsubscribed from all messages');
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
