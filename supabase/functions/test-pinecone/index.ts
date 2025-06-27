import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  try {
    console.log('🔍 Testing Pinecone connection...');

    // Get secrets from environment
    const pineconeApiKey = Deno.env.get('PINECONE_API_KEY');
    const indexName = Deno.env.get('PINECONE_INDEX_NAME');

    if (!pineconeApiKey || !indexName) {
      throw new Error('Missing Pinecone API key or index name in environment variables');
    }

    console.log('✅ Secrets retrieved successfully');
    console.log(`📊 Index name: ${indexName}`);

    // Test basic Pinecone API connectivity
    console.log('🔗 Testing Pinecone API connectivity...');

    // First, let's try to list all indexes
    const listResponse = await fetch('https://controller.pinecone.io/databases', {
      method: 'GET',
      headers: {
        'Api-Key': pineconeApiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!listResponse.ok) {
      throw new Error(
        `Failed to list databases: ${listResponse.status} ${listResponse.statusText}`,
      );
    }

    const databases = await listResponse.json();
    console.log('✅ Pinecone API connection successful!');
    console.log('📋 Available databases:', databases);

    // Check if our index exists
    const indexExists = databases.some((db: any) => db.name === indexName);

    if (indexExists) {
      console.log(`✅ Index '${indexName}' found!`);

      // Try to get stats for the index
      const statsResponse = await fetch(
        `https://${indexName}-${pineconeApiKey.slice(0, 8)}.svc.pinecone.io/describe_index_stats`,
        {
          method: 'GET',
          headers: {
            'Api-Key': pineconeApiKey,
            'Content-Type': 'application/json',
          },
        },
      );

      if (statsResponse.ok) {
        const stats = await statsResponse.json();
        console.log('📊 Index statistics:', stats);
      } else {
        console.log('⚠️  Could not get index stats:', statsResponse.status);
      }
    } else {
      console.log(`⚠️  Index '${indexName}' not found in available databases`);
      console.log(
        'Available databases:',
        databases.map((db: any) => db.name),
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Pinecone connection test completed',
        indexName,
        indexExists,
        availableDatabases: databases.map((db: any) => db.name),
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      },
    );
  } catch (error) {
    console.error('❌ Pinecone connection test failed:', error.message);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      },
    );
  }
});
