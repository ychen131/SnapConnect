/**
 * @file snapService.ts
 * @description Service for uploading media and sending snaps to friends.
 */
import { supabase } from './supabase';

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
    const blob = await response.blob();

    // Upload to Supabase Storage (bucket: 'media')
    const { data, error } = await supabase.storage.from('media').upload(path, blob, {
      cacheControl: '3600',
      upsert: false,
      contentType: blob.type,
    });
    if (error) throw error;

    // Get public URL
    const { data: publicUrlData } = supabase.storage.from('media').getPublicUrl(path);
    if (!publicUrlData?.publicUrl) throw new Error('Failed to get public URL');
    return publicUrlData.publicUrl;
  } catch (error) {
    console.error('Error uploading media:', error);
    throw error;
  }
}

/**
 * Sends a snap to a list of friends by inserting records into the snaps table.
 * @param senderId The sender's user ID
 * @param recipientIds Array of recipient user IDs
 * @param mediaUrl The public URL of the media
 * @param mediaType 'photo' | 'video'
 * @param timer Optional timer for photos
 */
export async function sendSnapToFriends({
  senderId,
  recipientIds,
  mediaUrl,
  mediaType,
  timer,
}: {
  senderId: string;
  recipientIds: string[];
  mediaUrl: string;
  mediaType: 'photo' | 'video';
  timer?: number;
}): Promise<void> {
  try {
    const inserts = recipientIds.map((recipientId) => ({
      sender_id: senderId,
      recipient_id: recipientId,
      media_url: mediaUrl,
      media_type: mediaType,
      timer: mediaType === 'photo' ? timer : null,
    }));
    const { error } = await supabase.from('snaps').insert(inserts);
    if (error) throw error;
  } catch (error) {
    console.error('Error sending snaps:', error);
    throw error;
  }
}
