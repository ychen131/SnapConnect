/**
 * Vibe Check RAG Edge Function
 *
 * This function orchestrates the complete RAG pipeline for analyzing dog photos:
 * 1. Vision Analysis: Uses OpenAI Vision to analyze the dog's body language
 * 2. Retrieval: Queries Pinecone for relevant knowledge base articles
 * 3. Generation: Creates the final "vibe check" response
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Pinecone } from 'https://esm.sh/@pinecone-database/pinecone@1.1.2';
import { OpenAIEmbeddings } from 'https://esm.sh/@langchain/openai@0.0.14';
import OpenAI from 'https://esm.sh/openai@4.20.1';
import { Client } from 'https://esm.sh/@langsmith/client@0.0.1';

// Types
interface VibeCheckRequest {
  imageBase64: string;
  userId: string;
}

interface VisionAnalysis {
  bodyLanguage: string;
  mood: string;
  behavior: string;
  confidence: number;
}

interface RetrievedDocument {
  title: string;
  content: string;
  source_url: string;
  score: number;
}

interface VibeCheckResponse {
  vibeCheck: string;
  sourceUrl: string;
  confidence: number;
  analysis: VisionAnalysis;
}

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

// Initialize Pinecone
const pinecone = new Pinecone({
  apiKey: Deno.env.get('PINECONE_API_KEY')!,
});

// Initialize embeddings
const embeddings = new OpenAIEmbeddings({
  openAIApiKey: Deno.env.get('OPENAI_API_KEY')!,
  modelName: 'text-embedding-ada-002',
});

// Initialize LangSmith client
const langSmithClient = new Client({
  apiKey: Deno.env.get('LANGSMITH_API_KEY'),
  project: Deno.env.get('LANGSMITH_PROJECT') || 'snapdog-vibe-check',
});

const indexName = Deno.env.get('PINECONE_INDEX_NAME') || 'snapdog-kb';

/**
 * Step 1: Vision Analysis
 * Analyzes the dog photo using OpenAI Vision API
 */
async function analyzeVision(imageBase64: string): Promise<VisionAnalysis> {
  const visionPrompt = `
You are an expert in canine body language and behavior. Analyze this dog photo and provide a detailed assessment.

Please return a JSON object with the following structure:
{
  "bodyLanguage": "Detailed description of the dog's body language including tail position, ear position, facial expressions, body posture, etc.",
  "mood": "The dog's apparent emotional state (happy, anxious, playful, stressed, etc.)",
  "behavior": "What the dog appears to be doing or trying to communicate",
  "confidence": 0.85
}

Focus on specific, observable cues and be as detailed as possible. The confidence should be between 0 and 1.
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: visionPrompt },
            {
              type: 'image_url',
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 1000,
      temperature: 0.1,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from vision analysis');
    }

    // Parse the JSON response
    const analysis = JSON.parse(content);
    return analysis;
  } catch (error) {
    console.error('Vision analysis error:', error);
    throw new Error(`Vision analysis failed: ${(error as Error).message}`);
  }
}

/**
 * Step 2: Knowledge Retrieval
 * Queries Pinecone for relevant knowledge base articles
 */
async function retrieveKnowledge(analysis: VisionAnalysis): Promise<RetrievedDocument[]> {
  try {
    // Create a search query from the vision analysis
    const searchQuery = `${analysis.bodyLanguage} ${analysis.mood} ${analysis.behavior}`;

    // Generate embedding for the search query
    const queryEmbedding = await embeddings.embedQuery(searchQuery);

    // Query Pinecone
    const index = pinecone.index(indexName);
    const queryResult = await index.query({
      vector: queryEmbedding,
      topK: 3,
      includeMetadata: true,
    });

    // Transform results
    const documents: RetrievedDocument[] =
      queryResult.matches?.map((match: any) => ({
        title: match.metadata?.title || 'Unknown',
        content: match.metadata?.text || '',
        source_url: match.metadata?.source_url || '',
        score: match.score || 0,
      })) || [];

    return documents;
  } catch (error) {
    console.error('Knowledge retrieval error:', error);
    throw new Error(`Knowledge retrieval failed: ${(error as Error).message}`);
  }
}

/**
 * Step 3: Response Generation
 * Creates the final "vibe check" response using retrieved knowledge
 */
async function generateVibeCheck(
  analysis: VisionAnalysis,
  documents: RetrievedDocument[],
): Promise<{ vibeCheck: string; sourceUrl: string }> {
  const context = documents
    .map((doc, index) => `${index + 1}. ${doc.title}: ${doc.content}`)
    .join('\n\n');

  const generationPrompt = `
You are SnapDog's AI expert on canine behavior. Based on the vision analysis and knowledge base, provide a fun, engaging "vibe check" for this dog.

VISION ANALYSIS:
- Body Language: ${analysis.bodyLanguage}
- Mood: ${analysis.mood}
- Behavior: ${analysis.behavior}
- Confidence: ${analysis.confidence}

KNOWLEDGE BASE CONTEXT:
${context}

INSTRUCTIONS:
1. Write a friendly, conversational "vibe check" (2-3 sentences)
2. Use the knowledge base to provide accurate, educational insights
3. Keep it light and fun while being informative
4. Reference specific body language cues you observe
5. If the dog seems stressed or anxious, provide gentle guidance
6. If the dog is happy/playful, celebrate their good vibes

Tone: Friendly, knowledgeable, and supportive - like a caring dog expert friend.

RESPONSE FORMAT:
Return only the vibe check text, no additional formatting.
`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: generationPrompt,
        },
      ],
      max_tokens: 300,
      temperature: 0.7,
    });

    const vibeCheck = response.choices[0]?.message?.content?.trim();
    if (!vibeCheck) {
      throw new Error('No response from generation');
    }

    // Use the top document as the source
    const sourceUrl = documents[0]?.source_url || '';

    return { vibeCheck, sourceUrl };
  } catch (error) {
    console.error('Generation error:', error);
    throw new Error(`Response generation failed: ${(error as Error).message}`);
  }
}

/**
 * Main handler function
 */
async function handleVibeCheck(request: VibeCheckRequest): Promise<VibeCheckResponse> {
  try {
    console.log('🚀 Starting Vibe Check for user:', request.userId);

    // Step 1: Vision Analysis
    console.log('🔍 Step 1: Analyzing vision...');
    const analysis = await analyzeVision(request.imageBase64);
    console.log('✅ Vision analysis complete');

    // Step 2: Knowledge Retrieval
    console.log('📚 Step 2: Retrieving knowledge...');
    const documents = await retrieveKnowledge(analysis);
    console.log(`✅ Retrieved ${documents.length} relevant documents`);

    // Step 3: Response Generation
    console.log('✨ Step 3: Generating vibe check...');
    const { vibeCheck, sourceUrl } = await generateVibeCheck(analysis, documents);
    console.log('✅ Vibe check generated');

    // Return the complete response
    return {
      vibeCheck,
      sourceUrl,
      confidence: analysis.confidence,
      analysis,
    };
  } catch (error) {
    console.error('❌ Vibe Check failed:', error);
    throw error;
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
    // Parse request
    const { imageBase64, userId } = await req.json();

    if (!imageBase64 || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: imageBase64, userId' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        },
      );
    }

    // Process the vibe check
    const result = await handleVibeCheck({ imageBase64, userId });

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('❌ Request failed:', error);

    return new Response(
      JSON.stringify({
        error: 'Vibe Check failed',
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
