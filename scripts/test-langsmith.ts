/**
 * Test script for LangSmith tracing
 * This script tests basic LangSmith functionality
 */

import { Client } from 'langsmith';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function testLangSmith() {
  try {
    console.log('🧪 Testing LangSmith integration...');

    const apiKey = process.env.LANGSMITH_API_KEY;
    if (!apiKey) {
      throw new Error('LANGSMITH_API_KEY not found in environment variables');
    }

    // Initialize LangSmith client
    const client = new Client({
      apiKey: apiKey,
    });

    console.log('✅ LangSmith client initialized');

    // Test basic connection by listing runs
    console.log('📊 Testing connection by listing recent runs...');
    const runs = await client.listRuns({
      limit: 3,
    });

    let count = 0;
    for await (const run of runs) {
      count++;
      console.log(`${count}. ${run.name} - ${run.status}`);
    }

    console.log(`✅ Successfully connected to LangSmith! Found ${count} recent runs.`);
    console.log('🔗 Check your traces at: https://smith.langchain.com/');
    console.log('🎉 LangSmith integration is working correctly!');
  } catch (error) {
    console.error('❌ LangSmith test failed:', error);
    throw error;
  }
}

// Run the test
testLangSmith()
  .then(() => {
    console.log('✅ All tests passed!');
  })
  .catch((error) => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
