/**
 * Test script for the Vibe Check Feedback function
 * This script tests the feedback logging functionality
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testFeedbackFunction() {
  try {
    console.log('🧪 Testing Vibe Check Feedback function...');

    // Initialize Supabase client
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing Supabase environment variables');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Test feedback data
    const testFeedback = {
      sessionId: 'test-session-123',
      vibeCheckText: 'Your dog is showing classic play behavior with that wagging tail!',
      sourceUrl: 'https://www.akc.org/expert-advice/health/dog-play-behavior/',
      confidenceScore: 0.85,
      analysisData: {
        bodyLanguage: 'Tail wagging, ears forward',
        mood: 'happy and playful',
        behavior: 'showing interest in play',
      },
      feedbackType: 'thumbs_up' as const,
      feedbackComment: 'Great analysis!',
      imageSize: 1024000,
      imageHash: 'abc123',
    };

    console.log('📤 Sending test feedback...');

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('log-vibe-feedback', {
      body: testFeedback,
    });

    if (error) {
      console.error('❌ Function call failed:', error);
      throw error;
    }

    console.log('✅ Function call successful!');
    console.log('📊 Response:', JSON.stringify(data, null, 2));

    // Validate response structure
    if (data.success && data.feedbackId) {
      console.log('✅ Feedback logged successfully');
      console.log(`🆔 Feedback ID: ${data.feedbackId}`);
      console.log(`💬 Message: ${data.message}`);
    } else {
      console.log('⚠️  Response structure is incomplete');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the test
testFeedbackFunction()
  .then(() => {
    console.log('🎉 Feedback function test completed!');
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
