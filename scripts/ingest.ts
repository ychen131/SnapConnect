/**
 * Knowledge Base Ingestion Script
 *
 * This script processes the curated dog behavior articles and loads them into Pinecone.
 * It reads JSON files, chunks the content, creates embeddings, and stores them in the vector database.
 */

import { Pinecone } from '@pinecone-database/pinecone';
import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from '@langchain/openai';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

interface KnowledgeBaseArticle {
  title: string;
  source_url: string;
  content: string;
  topics: string[];
  source: string;
  date_added: string;
}

interface ChunkedDocument {
  id: string;
  text: string;
  metadata: {
    title: string;
    source_url: string;
    source: string;
    topics: string[];
    date_added: string;
    chunk_index: number;
    total_chunks: number;
  };
}

interface VectorDocument {
  id: string;
  values: number[];
  metadata: any;
}

class KnowledgeBaseIngester {
  private pinecone: Pinecone;
  private embeddings: OpenAIEmbeddings;
  private textSplitter: RecursiveCharacterTextSplitter;
  private indexName: string;

  constructor() {
    // Initialize Pinecone
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      throw new Error('PINECONE_API_KEY not found in environment variables');
    }
    this.pinecone = new Pinecone({ apiKey });

    // Initialize OpenAI embeddings
    const openaiApiKey = process.env.OPENAI_API_KEY;
    if (!openaiApiKey) {
      throw new Error('OPENAI_API_KEY not found in environment variables');
    }
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: openaiApiKey,
      modelName: 'text-embedding-ada-002',
    });

    // Initialize text splitter
    this.textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
      separators: ['\n\n', '\n', '. ', '! ', '? ', ' ', ''],
    });

    this.indexName = process.env.PINECONE_INDEX_NAME || 'snapdog-kb';
  }

  /**
   * Read all JSON files from the knowledge base directory
   */
  private async loadKnowledgeBaseArticles(): Promise<KnowledgeBaseArticle[]> {
    const knowledgeBaseDir = path.join(process.cwd(), 'data', 'knowledge-base');
    const articles: KnowledgeBaseArticle[] = [];

    try {
      const files = fs.readdirSync(knowledgeBaseDir);

      for (const file of files) {
        if (file.endsWith('.json') && file !== 'README.md') {
          const filePath = path.join(knowledgeBaseDir, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          const article: KnowledgeBaseArticle = JSON.parse(content);
          articles.push(article);
          console.log(`📖 Loaded article: ${article.title}`);
        }
      }
    } catch (error) {
      console.error('❌ Error loading knowledge base articles:', error);
      throw error;
    }

    return articles;
  }

  /**
   * Split articles into chunks
   */
  private async chunkArticles(articles: KnowledgeBaseArticle[]): Promise<ChunkedDocument[]> {
    const chunkedDocuments: ChunkedDocument[] = [];

    for (const article of articles) {
      try {
        console.log(`✂️  Chunking article: ${article.title}`);

        // Split the content into chunks
        const chunks = await this.textSplitter.splitText(article.content);

        // Create chunked documents with metadata
        chunks.forEach((chunk: string, index: number) => {
          const chunkedDoc: ChunkedDocument = {
            id: `${article.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}-chunk-${index}`,
            text: chunk,
            metadata: {
              title: article.title,
              source_url: article.source_url,
              source: article.source,
              topics: article.topics,
              date_added: article.date_added,
              chunk_index: index,
              total_chunks: chunks.length,
            },
          };
          chunkedDocuments.push(chunkedDoc);
        });

        console.log(`✅ Created ${chunks.length} chunks for: ${article.title}`);
      } catch (error) {
        console.error(`❌ Error chunking article ${article.title}:`, error);
        throw error;
      }
    }

    return chunkedDocuments;
  }

  /**
   * Create embeddings for chunked documents
   */
  private async createEmbeddings(chunkedDocuments: ChunkedDocument[]): Promise<VectorDocument[]> {
    console.log(`🔍 Creating embeddings for ${chunkedDocuments.length} chunks...`);

    const vectors: VectorDocument[] = [];

    // Process in batches to avoid rate limits
    const batchSize = 10;
    for (let i = 0; i < chunkedDocuments.length; i += batchSize) {
      const batch = chunkedDocuments.slice(i, i + batchSize);

      try {
        // Create embeddings for the batch
        const texts = batch.map((doc) => doc.text);
        const embeddings = await this.embeddings.embedDocuments(texts);

        // Create vector objects
        batch.forEach((doc, index) => {
          vectors.push({
            id: doc.id,
            values: embeddings[index],
            metadata: doc.metadata,
          });
        });

        console.log(
          `✅ Processed batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunkedDocuments.length / batchSize)}`,
        );

        // Small delay to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (error) {
        console.error(
          `❌ Error creating embeddings for batch ${Math.floor(i / batchSize) + 1}:`,
          error,
        );
        throw error;
      }
    }

    return vectors;
  }

  /**
   * Upsert vectors to Pinecone
   */
  private async upsertToPinecone(vectors: VectorDocument[]): Promise<void> {
    console.log(`📤 Upserting ${vectors.length} vectors to Pinecone...`);

    try {
      // Get the index
      const index = this.pinecone.index(this.indexName);

      // Upsert in batches
      const batchSize = 100;
      for (let i = 0; i < vectors.length; i += batchSize) {
        const batch = vectors.slice(i, i + batchSize);

        await index.upsert(batch);
        console.log(
          `✅ Upserted batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(vectors.length / batchSize)}`,
        );

        // Small delay to avoid rate limits
        await new Promise((resolve) => setTimeout(resolve, 200));
      }

      console.log('🎉 Successfully upserted all vectors to Pinecone!');
    } catch (error) {
      console.error('❌ Error upserting to Pinecone:', error);
      throw error;
    }
  }

  /**
   * Verify the ingestion by querying the index
   */
  private async verifyIngestion(): Promise<void> {
    console.log('🔍 Verifying ingestion...');

    try {
      const index = this.pinecone.index(this.indexName);
      const stats = await index.describeIndexStats();

      console.log('📊 Index statistics:');
      console.log(`- Total vector count: ${stats.totalRecordCount}`);
      console.log(`- Dimension: ${stats.dimension}`);
      console.log(`- Index fullness: ${stats.indexFullness}`);

      // Test a simple query
      const testQuery = await this.embeddings.embedQuery('dog play behavior');
      const queryResult = await index.query({
        vector: testQuery,
        topK: 3,
        includeMetadata: true,
      });

      console.log('🔍 Test query results:');
      queryResult.matches?.forEach((match: any, index: number) => {
        console.log(`${index + 1}. ${match.metadata?.title} (score: ${match.score?.toFixed(3)})`);
      });
    } catch (error) {
      console.error('❌ Error verifying ingestion:', error);
      throw error;
    }
  }

  /**
   * Main ingestion process
   */
  async ingest(): Promise<void> {
    console.log('🚀 Starting knowledge base ingestion...');
    console.log(`📁 Index name: ${this.indexName}`);

    try {
      // Step 1: Load articles
      const articles = await this.loadKnowledgeBaseArticles();
      console.log(`📚 Loaded ${articles.length} articles`);

      // Step 2: Chunk articles
      const chunkedDocuments = await this.chunkArticles(articles);
      console.log(`✂️  Created ${chunkedDocuments.length} chunks`);

      // Step 3: Create embeddings
      const vectors = await this.createEmbeddings(chunkedDocuments);
      console.log(`🔍 Created ${vectors.length} embeddings`);

      // Step 4: Upsert to Pinecone
      await this.upsertToPinecone(vectors);

      // Step 5: Verify ingestion
      await this.verifyIngestion();

      console.log('🎉 Knowledge base ingestion completed successfully!');
    } catch (error) {
      console.error('❌ Ingestion failed:', error);
      throw error;
    }
  }
}

// Run the ingestion
async function main() {
  try {
    const ingester = new KnowledgeBaseIngester();
    await ingester.ingest();
  } catch (error) {
    console.error('❌ Main execution failed:', error);
    process.exit(1);
  }
}

// Execute if this file is run directly
if (import.meta && import.meta.url && process.argv[1] === new URL('', import.meta.url).pathname) {
  main();
}

export { KnowledgeBaseIngester };
