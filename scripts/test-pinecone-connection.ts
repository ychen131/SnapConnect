/**
 * Test script to verify Pinecone connection
 * This script tests the basic connectivity and operations with Pinecone
 */

import { Pinecone } from '@pinecone-database/pinecone';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client to get secrets
const supabaseUrl = process.env.SUPABASE_URL || 'your_supabase_url';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your_service_role_key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPineconeConnection() {
  try {
    console.log('🔍 Testing Pinecone connection...');

    // Get secrets from Supabase
    const { data: secrets } = await supabase.rpc('get_secrets');

    if (!secrets) {
      throw new Error('Could not retrieve secrets from Supabase');
    }

    const apiKey = secrets.PINECONE_API_KEY;
    const indexName = secrets.PINECONE_INDEX_NAME;

    if (!apiKey || !indexName) {
      throw new Error('Missing Pinecone API key or index name in secrets');
    }

    console.log('✅ Secrets retrieved successfully');
    console.log(`📊 Index name: ${indexName}`);

    // Initialize Pinecone client
    const pc = new Pinecone({
      apiKey: apiKey,
    });

    console.log('🔗 Initializing Pinecone client...');

    // Check if index exists
    const indexes = await pc.listIndexes();
    console.log(
      '📋 Available indexes:',
      indexes.map((idx: any) => idx.name),
    );

    const targetIndex = indexes.find((idx: any) => idx.name === indexName);

    if (!targetIndex) {
      throw new Error(
        `Index '${indexName}' not found. Available indexes: ${indexes.map((idx: any) => idx.name).join(', ')}`,
      );
    }

    console.log('✅ Index found successfully');

    // Get index stats
    const index = pc.index(indexName);
    const stats = await index.describeIndexStats();

    console.log('📊 Index statistics:');
    console.log('- Dimension:', stats.dimension);
    console.log('- Metric:', stats.metric);
    console.log('- Total vector count:', stats.totalVectorCount);
    console.log('- Index fullness:', stats.indexFullness);

    // Test basic operations with a sample vector
    console.log('🧪 Testing basic operations...');

    const testVector = new Array(1536).fill(0.1); // OpenAI ada-002 embedding dimension
    const testId = `test-${Date.now()}`;

    // Test upsert
    await index.upsert([
      {
        id: testId,
        values: testVector,
        metadata: { test: true, timestamp: new Date().toISOString() },
      },
    ]);

    console.log('✅ Upsert operation successful');

    // Wait a moment for indexing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Test query
    const queryResult = await index.query({
      vector: testVector,
      topK: 1,
      includeMetadata: true,
    });

    console.log('✅ Query operation successful');
    console.log('🔍 Query result:', queryResult.matches?.length || 0, 'matches found');

    // Clean up test vector
    await index.deleteOne(testId);
    console.log('✅ Delete operation successful');

    console.log('🎉 All Pinecone operations successful!');
    console.log('✅ Connection test completed successfully');
  } catch (error) {
    console.error('❌ Pinecone connection test failed:', error);
    process.exit(1);
  }
}

// Run the test
testPineconeConnection();
