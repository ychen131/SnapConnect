/**
 * @file chatService.ts
 * @description Service for managing conversations and messages in the chat system.
 */
import { supabase } from './supabase';

/**
 * Conversation data structure
 */
export interface Conversation {
  id: string;
  user1_id: string;
  user2_id: string;
  last_message_id?: string;
  last_message_at: string;
  created_at: string;
  updated_at: string;
  // Computed fields
  other_user_id: string;
  other_user_username: string;
  other_user_avatar_url?: string;
  last_message_content?: string;
  last_message_type?: string;
  unread_count: number;
}

/**
 * Message data structure
 */
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  message_type: 'text' | 'photo' | 'video';
  content?: string;
  media_url?: string;
  media_type?: 'photo' | 'video';
  timer?: number;
  is_viewed: boolean;
  viewed_at?: string;
  reply_to_message_id?: string;
  created_at: string;
  updated_at: string;
  // Computed fields
  sender_username: string;
  sender_avatar_url?: string;
  // Reply-related computed fields
  original_message?: Message;
}

/**
 * Gets all conversations for the current user
 * @param userId The current user's ID
 * @returns Promise<Conversation[]> List of conversations
 */
export async function getConversations(userId: string): Promise<Conversation[]> {
  try {
    console.log('🔍 Getting conversations for user:', userId);

    const { data, error } = await supabase
      .from('conversations')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .order('last_message_at', { ascending: false });

    if (error) {
      console.error('❌ Error fetching conversations:', error);
      return [];
    }

    console.log('📋 Raw conversations data:', data);

    // Transform the data to include computed fields
    const conversations: Conversation[] = await Promise.all(
      (data || []).map(async (conv) => {
        const otherUserId = conv.user1_id === userId ? conv.user2_id : conv.user1_id;
        console.log('👤 Processing conversation with other user:', otherUserId);

        // Get other user's profile info
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username, avatar_url')
          .eq('id', otherUserId)
          .single();

        // Get unread count
        const { count: unreadCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })
          .eq('conversation_id', conv.id)
          .eq('recipient_id', userId)
          .eq('is_viewed', false);

        // Get last message details
        const { data: lastMessageData } = await supabase
          .from('messages')
          .select('content, message_type, media_type, created_at')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        const conversation = {
          ...conv,
          other_user_id: otherUserId,
          other_user_username: profileData?.username || 'Unknown User',
          other_user_avatar_url: profileData?.avatar_url,
          last_message_content: lastMessageData?.content || 'No messages yet',
          last_message_type: lastMessageData?.message_type || 'text',
          unread_count: unreadCount || 0,
        };

        console.log('✅ Processed conversation:', conversation);
        return conversation;
      }),
    );

    console.log('🎉 Final conversations result:', conversations);
    return conversations;
  } catch (error) {
    console.error('❌ Error fetching conversations:', error);
    return [];
  }
}

/**
 * Gets messages for a specific conversation
 * @param conversationId The conversation ID
 * @param userId The current user's ID
 * @returns Promise<Message[]> List of messages
 */
export async function getMessages(conversationId: string, userId: string): Promise<Message[]> {
  try {
    const { data, error } = await supabase
      .from('messages')
      .select(
        `
        *,
        profiles!messages_sender_id_fkey(username, avatar_url)
      `,
      )
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }

    // Transform the data to include computed fields and reply relationships
    const messages: Message[] = await Promise.all(
      (data || []).map(async (msg) => {
        let originalMessage: Message | undefined;

        // If this is a reply, fetch the original message
        if (msg.reply_to_message_id) {
          const { data: originalData } = await supabase
            .from('messages')
            .select(
              `
              *,
              profiles!messages_sender_id_fkey(username, avatar_url)
            `,
            )
            .eq('id', msg.reply_to_message_id)
            .single();

          if (originalData) {
            originalMessage = {
              ...originalData,
              sender_username: originalData.profiles?.username || 'Unknown User',
              sender_avatar_url: originalData.profiles?.avatar_url,
            };
          }
        }

        return {
          ...msg,
          sender_username: msg.profiles?.username || 'Unknown User',
          sender_avatar_url: msg.profiles?.avatar_url,
          original_message: originalMessage,
        };
      }),
    );

    return messages;
  } catch (error) {
    console.error('Error fetching messages:', error);
    return [];
  }
}

/**
 * Marks messages as viewed in a conversation
 * @param conversationId The conversation ID
 * @param userId The current user's ID
 * @returns Promise<boolean> Success status
 */
export async function markMessagesAsViewed(
  conversationId: string,
  userId: string,
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('messages')
      .update({
        is_viewed: true,
        viewed_at: new Date().toISOString(),
      })
      .eq('conversation_id', conversationId)
      .eq('recipient_id', userId)
      .eq('is_viewed', false);

    if (error) {
      console.error('Error marking messages as viewed:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error marking messages as viewed:', error);
    return false;
  }
}

/**
 * Gets or creates a conversation between two users
 * @param user1Id First user's ID
 * @param user2Id Second user's ID
 * @returns Promise<string> Conversation ID
 */
export async function getOrCreateConversation(user1Id: string, user2Id: string): Promise<string> {
  try {
    // Call the database function to get or create conversation
    const { data, error } = await supabase.rpc('get_or_create_conversation', {
      user1_uuid: user1Id,
      user2_uuid: user2Id,
    });

    if (error) {
      console.error('Error getting or creating conversation:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error getting or creating conversation:', error);
    throw error;
  }
}

/**
 * Sends a text reply to a specific message
 * @param conversationId The conversation ID
 * @param senderId The sender's user ID
 * @param recipientId The recipient's user ID
 * @param replyText The text content of the reply
 * @param replyToMessageId The ID of the message being replied to
 * @returns Promise<boolean> Success status
 */
export async function sendTextReply(
  conversationId: string,
  senderId: string,
  recipientId: string,
  replyText: string,
  replyToMessageId: string,
): Promise<boolean> {
  try {
    console.log('💬 Sending text reply:', {
      conversationId,
      senderId,
      recipientId,
      replyText,
      replyToMessageId,
    });

    // Verify the original message exists and is in the same conversation
    const { data: originalMessage, error: fetchError } = await supabase
      .from('messages')
      .select('id, conversation_id, message_type, content, media_url')
      .eq('id', replyToMessageId)
      .eq('conversation_id', conversationId)
      .single();

    if (fetchError || !originalMessage) {
      console.error('❌ Original message not found or not in conversation:', fetchError);
      throw new Error('Original message not found');
    }

    // Create the reply message
    const { error: insertError } = await supabase.from('messages').insert({
      conversation_id: conversationId,
      sender_id: senderId,
      recipient_id: recipientId,
      message_type: 'text',
      content: replyText,
      reply_to_message_id: replyToMessageId,
      is_viewed: false,
    });

    if (insertError) {
      console.error('❌ Error creating reply message:', insertError);
      throw insertError;
    }

    console.log('✅ Text reply sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Error sending text reply:', error);
    throw error;
  }
}
