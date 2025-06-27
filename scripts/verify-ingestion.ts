/**
 * Verification script to check Pinecone ingestion
 * This script verifies that the vectors were properly stored and can be queried
 */

import { Pinecone } from '@pinecone-database/pinecone';
import { OpenAIEmbeddings } from '@langchain/openai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function verifyIngestion() {
  try {
    console.log('🔍 Verifying Pinecone ingestion...');

    // Initialize Pinecone
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      throw new Error('PINECONE_API_KEY not found in environment variables');
    }
    const pinecone = new Pinecone({ apiKey });

    // Initialize OpenAI embeddings
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not found in environment variables');
    }
    const embeddings = new OpenAIEmbeddings({
      openAIApiKey: openaiApiKey,
      modelName: 'text-embedding-ada-002',
    });

    const indexName = process.env.PINECONE_INDEX_NAME || 'snapdog-kb';
    const index = pinecone.index(indexName);

    // Get index statistics
    console.log('📊 Getting index statistics...');
    const stats = await index.describeIndexStats();

    console.log('📊 Index statistics:');
    console.log(`- Total vector count: ${stats.totalRecordCount}`);
    console.log(`- Dimension: ${stats.dimension}`);
    console.log(`- Index fullness: ${stats.indexFullness}`);

    if (stats.totalRecordCount === 0) {
      console.log('⚠️  Warning: Index shows 0 vectors. This might be due to:');
      console.log('   - Index replication delay (wait a few minutes)');
      console.log('   - Index in different region/project');
      console.log('   - Cached statistics');
    }

    // Test a simple query
    console.log('🔍 Testing query functionality...');
    const testQuery = await embeddings.embedQuery('dog play behavior');
    const queryResult = await index.query({
      vector: testQuery,
      topK: 3,
      includeMetadata: true,
    });

    console.log('🔍 Test query results:');
    if (queryResult.matches && queryResult.matches.length > 0) {
      queryResult.matches.forEach((match: any, index: number) => {
        console.log(`${index + 1}. ${match.metadata?.title} (score: ${match.score?.toFixed(3)})`);
      });
      console.log('✅ Query test successful - vectors are accessible!');
    } else {
      console.log('❌ No results returned from query');
    }
  } catch (error) {
    console.error('❌ Verification failed:', error);
    throw error;
  }
}

// Run verification
verifyIngestion()
  .then(() => {
    console.log('🎉 Verification completed!');
  })
  .catch((error) => {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  });
