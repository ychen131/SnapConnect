/**
 * @file realtime.ts
 * @description Service for managing Supabase Realtime subscriptions (chat messages, etc).
 */
import { supabase } from './supabase';

let messageChannel: any = null;

/**
 * Subscribe to new chat messages for the current user.
 * @param userId The current user's ID
 * @param onNewMessage Callback for new message events
 */
export function subscribeToNewMessages(userId: string, onNewMessage: (payload: any) => void) {
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
        onNewMessage(payload);
      },
    )
    .subscribe((status: any) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Subscribed to new messages for user', userId);
      }
    });
}

/**
 * Unsubscribe from chat message realtime events.
 */
export function unsubscribeFromNewMessages() {
  if (messageChannel) {
    messageChannel.unsubscribe();
    messageChannel = null;
    console.log('🛑 Unsubscribed from new messages');
  }
}
