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
    // Validate inputs
    if (!localUri || !userId) {
      throw new Error('Invalid input: localUri and userId are required');
    }

    // Validate file URI format
    if (!localUri.startsWith('file://') && !localUri.startsWith('content://')) {
      throw new Error('Invalid file URI format');
    }

    // Get file extension and validate
    const ext = localUri.split('.').pop()?.toLowerCase() || 'jpg';
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'avi'];

    if (!allowedExtensions.includes(ext)) {
      throw new Error(
        `Unsupported file type: ${ext}. Supported types: ${allowedExtensions.join(', ')}`,
      );
    }

    const fileName = `${userId}_${Date.now()}.${ext}`;
    const path = `snaps/${userId}/${fileName}`;

    // Determine content type based on extension
    let contentType = 'image/jpeg'; // default
    if (ext === 'png') contentType = 'image/png';
    else if (ext === 'gif') contentType = 'image/gif';
    else if (ext === 'mp4') contentType = 'video/mp4';
    else if (ext === 'mov') contentType = 'video/quicktime';
    else if (ext === 'avi') contentType = 'video/x-msvideo';

    // Fetch the file with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    try {
      const response = await fetch(localUri, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.status} ${response.statusText}`);
      }

      const bytes = await response.arrayBuffer();

      // Validate file size (max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (bytes.byteLength > maxSize) {
        throw new Error(
          `File too large: ${(bytes.byteLength / 1024 / 1024).toFixed(1)}MB. Maximum size is 50MB.`,
        );
      }

      console.log('🟣 uploadMediaToStorage bytes:', {
        size: bytes.byteLength,
        type: contentType,
        localUri,
      });

      // Upload to Supabase Storage with retry mechanism
      let uploadAttempts = 0;
      const maxUploadAttempts = 3;

      while (uploadAttempts < maxUploadAttempts) {
        try {
          const { data, error } = await supabase.storage.from('media').upload(path, bytes, {
            cacheControl: '3600',
            upsert: false,
            contentType: contentType,
          });

          if (error) {
            console.error(`Upload attempt ${uploadAttempts + 1} failed:`, error);
            throw error;
          }

          // Get the public URL
          const { data: urlData } = supabase.storage.from('media').getPublicUrl(path);

          if (!urlData?.publicUrl) {
            throw new Error('Failed to get public URL for uploaded file');
          }

          console.log('✅ Media uploaded successfully:', urlData.publicUrl);
          return urlData.publicUrl;
        } catch (uploadError) {
          uploadAttempts++;

          if (uploadAttempts >= maxUploadAttempts) {
            throw uploadError;
          }

          // Wait before retry (exponential backoff)
          await new Promise((resolve) => setTimeout(resolve, 1000 * uploadAttempts));
          console.log(`Retrying upload (attempt ${uploadAttempts + 1}/${maxUploadAttempts})...`);
        }
      }
    } catch (fetchError) {
      clearTimeout(timeoutId);
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error('Upload timeout: File took too long to process');
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Error uploading media:', error);

    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('network') || error.message.includes('fetch')) {
        throw new Error('Network error: Please check your connection and try again');
      } else if (error.message.includes('storage') || error.message.includes('upload')) {
        throw new Error('Storage error: Failed to upload file. Please try again');
      } else if (error.message.includes('timeout')) {
        throw new Error('Upload timeout: File took too long to process. Please try a smaller file');
      } else if (error.message.includes('too large')) {
        throw new Error('File too large: Please select a smaller file (max 50MB)');
      } else if (error.message.includes('Unsupported file type')) {
        throw new Error(
          'Unsupported file type: Please select a photo (JPG, PNG, GIF) or video (MP4, MOV, AVI)',
        );
      }
    }

    throw error;
  }

  // This should never be reached, but TypeScript needs it
  throw new Error('Unexpected error: Upload failed for unknown reason');
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
