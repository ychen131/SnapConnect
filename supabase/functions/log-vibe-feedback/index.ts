/**
 * Log Vibe Check Feedback Edge Function
 *
 * This function handles logging user feedback on Vibe Check responses.
 * It stores feedback data and updates analytics for continuous improvement.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Types
interface FeedbackRequest {
  sessionId: string;
  vibeCheckText: string;
  sourceUrl?: string;
  confidenceScore?: number;
  analysisData?: any;
  feedbackType: 'thumbs_up' | 'thumbs_down' | 'correction';
  feedbackComment?: string;
  correctionText?: string;
  correctionReason?: string;
  imageSize?: number;
  imageHash?: string;
}

interface FeedbackResponse {
  success: boolean;
  feedbackId?: string;
  message?: string;
}

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Log feedback to the database
 */
async function logFeedback(
  userId: string,
  feedbackData: FeedbackRequest,
): Promise<{ success: boolean; feedbackId?: string; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('vibe_check_feedback')
      .insert({
        user_id: userId,
        session_id: feedbackData.sessionId,
        image_hash: feedbackData.imageHash,
        image_size: feedbackData.imageSize,
        vibe_check_text: feedbackData.vibeCheckText,
        source_url: feedbackData.sourceUrl,
        confidence_score: feedbackData.confidenceScore,
        analysis_data: feedbackData.analysisData,
        feedback_type: feedbackData.feedbackType,
        feedback_comment: feedbackData.feedbackComment,
        correction_text: feedbackData.correctionText,
        correction_reason: feedbackData.correctionReason,
      })
      .select('id')
      .single();

    if (error) {
      console.error('❌ Database error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, feedbackId: data.id };
  } catch (error) {
    console.error('❌ Logging error:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Get user analytics summary
 */
async function getUserAnalytics(userId: string): Promise<any> {
  try {
    // Get user's feedback summary
    const { data: feedbackSummary, error: feedbackError } = await supabase
      .from('vibe_check_feedback')
      .select('feedback_type, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(100);

    if (feedbackError) {
      console.error('❌ Analytics error:', feedbackError);
      return null;
    }

    // Calculate summary statistics
    const totalFeedback = feedbackSummary.length;
    const thumbsUp = feedbackSummary.filter((f) => f.feedback_type === 'thumbs_up').length;
    const thumbsDown = feedbackSummary.filter((f) => f.feedback_type === 'thumbs_down').length;
    const corrections = feedbackSummary.filter((f) => f.feedback_type === 'correction').length;

    return {
      totalFeedback,
      thumbsUp,
      thumbsDown,
      corrections,
      satisfactionRate: totalFeedback > 0 ? (thumbsUp / (thumbsUp + thumbsDown)) * 100 : 0,
      recentActivity: feedbackSummary.slice(0, 10),
    };
  } catch (error) {
    console.error('❌ Analytics calculation error:', error);
    return null;
  }
}

/**
 * Main handler function
 */
async function handleFeedback(request: FeedbackRequest, userId: string): Promise<FeedbackResponse> {
  try {
    console.log('📝 Logging feedback for user:', userId);
    console.log('📊 Feedback type:', request.feedbackType);

    // Validate required fields
    if (!request.sessionId || !request.vibeCheckText || !request.feedbackType) {
      return {
        success: false,
        message: 'Missing required fields: sessionId, vibeCheckText, feedbackType',
      };
    }

    // Validate feedback type
    const validTypes = ['thumbs_up', 'thumbs_down', 'correction'];
    if (!validTypes.includes(request.feedbackType)) {
      return {
        success: false,
        message: 'Invalid feedback type. Must be one of: thumbs_up, thumbs_down, correction',
      };
    }

    // Validate correction data if feedback type is correction
    if (request.feedbackType === 'correction' && !request.correctionText) {
      return {
        success: false,
        message: 'Correction text is required when feedback type is correction',
      };
    }

    // Log the feedback
    const result = await logFeedback(userId, request);

    if (!result.success) {
      return {
        success: false,
        message: result.error || 'Failed to log feedback',
      };
    }

    console.log('✅ Feedback logged successfully:', result.feedbackId);

    // Get updated analytics for the user
    const analytics = await getUserAnalytics(userId);

    return {
      success: true,
      feedbackId: result.feedbackId,
      message: 'Feedback logged successfully',
    };
  } catch (error) {
    console.error('❌ Feedback handling failed:', error);
    return {
      success: false,
      message: (error as Error).message,
    };
  }
}

// HTTP handler
serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  try {
    // Get user from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Missing or invalid Authorization header' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify the JWT token and get user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Invalid or expired token' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // Parse request body
    const feedbackData: FeedbackRequest = await req.json();

    // Process the feedback
    const result = await handleFeedback(feedbackData, user.id);

    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('❌ Request failed:', error);

    return new Response(
      JSON.stringify({
        error: 'Feedback logging failed',
        details: (error as Error).message,
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      },
    );
  }
});
