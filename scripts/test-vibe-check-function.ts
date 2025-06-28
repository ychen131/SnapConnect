/**
 * Test script for the Check Vibe RAG function
 * This script tests the complete RAG pipeline with a sample request
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';
import { analyzeDogImage } from '../src/services/vibeCheckService';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testVibeCheckFunction() {
  try {
    console.log('🧪 Testing Check Vibe RAG function...');

    // Initialize Supabase client
    const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Missing Supabase environment variables: EXPO_PUBLIC_SUPABASE_URL or EXPO_PUBLIC_SUPABASE_ANON_KEY',
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Create a valid test image (1x1 pixel PNG)
    const testImageBase64 =
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

    // Test request payload
    const testRequest = {
      imageBase64: testImageBase64,
      userId: 'test-user-123',
    };

    console.log('📤 Sending test request to Check Vibe function...');

    // Call the Edge Function
    const { data, error } = await supabase.functions.invoke('check-vibe-rag', {
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
    console.log('🎉 Check Vibe function test completed!');
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });

/**
 * Reads the base64 image string from a file.
 * @param filePath Path to the file containing the base64 string
 */
function readBase64Image(filePath: string): string {
  return fs.readFileSync(filePath, 'utf-8').trim();
}

async function testAnalyzeDogImage() {
  const base64Image = readBase64Image('image64.txt');
  const userId = 'test-user-id'; // Replace with a real user ID if needed

  try {
    const result = await analyzeDogImage(base64Image, userId);
    console.log('Vibe Check Result:', result);
  } catch (error) {
    console.error('Error from analyzeDogImage:', error);
  }
}

testAnalyzeDogImage();
