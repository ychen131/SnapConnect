/**
 * Test script for the Vibe Check RAG function
 * This script tests the complete RAG pipeline with a sample request
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testVibeCheckFunction() {
  try {
    console.log('🧪 Testing Vibe Check RAG function...');

    // Initialize Supabase client
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Missing Supabase environment variables: EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY',
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Create a test image (you can replace this with a real dog photo)
    // For now, we'll use a placeholder base64 string
    const testImageBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='; // 1x1 pixel

    // Test request payload
    const testRequest = {
      imageBase64: testImageBase64,
      userId: 'test-user-123',
    };

    console.log('📤 Sending test request to Vibe Check function...');

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('vibe-check-rag', {
      body: testRequest,
    });

    if (error) {
      console.error('❌ Function call failed:', error);
      throw error;
    }

    console.log('✅ Function call successful!');
    console.log('📊 Response:', JSON.stringify(data, null, 2));

    // Validate response structure
    if (data.vibeCheck && data.sourceUrl && data.confidence && data.analysis) {
      console.log('✅ Response structure is valid');
      console.log(`🎯 Vibe Check: ${data.vibeCheck}`);
      console.log(`🔗 Source: ${data.sourceUrl}`);
      console.log(`📈 Confidence: ${data.confidence}`);
      console.log(`🔍 Analysis:`, data.analysis);
    } else {
      console.log('⚠️  Response structure is incomplete');
    }
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  }
}

// Run the test
testVibeCheckFunction()
  .then(() => {
    console.log('🎉 Vibe Check function test completed!');
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
