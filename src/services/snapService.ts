/**
 * @file snapService.ts
 * @description Service for uploading media and sending snaps to friends.
 */
import { supabase } from './supabase';
import { getOrCreateConversation } from './chatService';

/**
 * Uploads a file (photo or video) to Supabase Storage and returns the public URL.
 * @param localUri The local file URI
 * @param userId The sender's user ID
 * @returns Promise<string> The public URL of the uploaded file
 */
export async function uploadMediaToStorage(localUri: string, userId: string): Promise<string> {
  try {
    // Get file extension
    const ext = localUri.split('.').pop() || 'jpg';
    const fileName = `${userId}_${Date.now()}.${ext}`;
    const path = `snaps/${userId}/${fileName}`;

    // Fetch the file as a blob
    const response = await fetch(localUri);
    // const blob = await response.blob();

    // // Debug log for blob
    // console.log('🟣 uploadMediaToStorage blob:', { size: blob.size, type: blob.type, localUri });

    // // Determine content type (fallback to image/jpeg)
    // // const contentType = blob.type || 'image/jpeg';
    // console.log('blob:', blob);
    const bytes = await response.arrayBuffer();
    console.log('🟣 uploadMediaToStorage bytes:', {
      size: bytes.byteLength,
      type: 'image/jpeg',
      localUri,
    });

    // Upload to Supabase Storage with correct content type
    const { data, error } = await supabase.storage.from('media').upload(path, bytes, {
      cacheControl: '3600',
      upsert: false,
      contentType: 'image/jpeg',
    });

    if (error) {
      console.error('Error uploading to storage:', error);
      throw error;
    }

    // Get the public URL
    const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);

    return urlData.publicUrl;
  } catch (error) {
    console.error('Error uploading media:', error);
    throw error;
  }
}

/**
 * Sends a snap to multiple friends by creating snap records and messages
 * @param contentUri The local content URI
 * @param contentType The type of content ('photo' or 'video')
 * @param recipientIds Array of recipient user IDs
 * @param senderId The sender's user ID
 * @param photoTimer Optional timer for photos (1-10 seconds)
 * @returns Promise<boolean> Success status
 */
export async function sendSnapToFriends(
  contentUri: string,
  contentType: 'photo' | 'video',
  recipientIds: string[],
  senderId: string,
  photoTimer?: number,
): Promise<boolean> {
  try {
    console.log('📤 Sending snap to friends:', recipientIds);
    console.log('📁 Content URI:', contentUri);
    console.log('📹 Content Type:', contentType);
    if (photoTimer) console.log('⏱️ Photo Timer:', photoTimer);

    // Upload media to storage
    const mediaUrl = await uploadMediaToStorage(contentUri, senderId);
    console.log('✅ Media uploaded successfully:', mediaUrl);

    // Send to each recipient
    for (const recipientId of recipientIds) {
      try {
        // Get or create conversation between sender and recipient
        const conversationId = await getOrCreateConversation(senderId, recipientId);

        // Create message in the messages table
        const { error: messageError } = await supabase.from('messages').insert({
          conversation_id: conversationId,
          sender_id: senderId,
          recipient_id: recipientId,
          message_type: contentType,
          media_url: mediaUrl,
          media_type: contentType,
          timer: photoTimer,
          is_viewed: false,
        });

        if (messageError) {
          console.error('Error creating message:', messageError);
          continue;
        }

        // Also create a record in the snaps table for backward compatibility
        const { error: snapError } = await supabase.from('snaps').insert({
          sender_id: senderId,
          recipient_id: recipientId,
          media_url: mediaUrl,
          media_type: contentType,
          timer: photoTimer,
          viewed: false,
        });

        if (snapError) {
          console.error('Error creating snap record:', snapError);
        }

        console.log('✅ Snap sent to:', recipientId);
      } catch (error) {
        console.error('Error sending snap to recipient:', recipientId, error);
      }
    }

    return true;
  } catch (error) {
    console.error('Error sending snaps:', error);
    throw error;
  }
}
