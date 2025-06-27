/**
 * Check Vibe RAG Edge Function
 *
 * This function orchestrates the complete RAG pipeline for analyzing dog photos:
 * 1. Vision Analysis: Uses OpenAI Vision to analyze the dog's body language
 * 2. Retrieval: Queries Pinecone for relevant knowledge base articles
 * 3. Generation: Creates the final "vibe check" response
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import OpenAI from 'https://esm.sh/openai@4.20.1';

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
    console.log('🚀 Check Vibe function started');

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

    console.log('📝 Processing request for user:', userId);

    // Step 1: Vision Analysis
    console.log('🔍 Step 1: Analyzing vision...');
    const analysis = await analyzeVision(imageBase64);
    console.log('✅ Vision analysis complete:', analysis);

    // For now, return a response with the vision analysis
    const response: VibeCheckResponse = {
      vibeCheck: `Based on the analysis, your dog appears to be ${analysis.mood.toLowerCase()} and ${analysis.behavior.toLowerCase()}. ${analysis.bodyLanguage}`,
      sourceUrl: 'https://example.com/vision-analysis',
      confidence: analysis.confidence,
      analysis: analysis,
    };

    console.log('✅ Check Vibe completed successfully');

    return new Response(JSON.stringify(response), {
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
        error: 'Check Vibe failed',
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
