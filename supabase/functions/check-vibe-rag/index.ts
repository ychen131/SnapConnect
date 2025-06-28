/**
 * Check Vibe RAG Edge Function
 *
 * This function orchestrates the complete RAG pipeline for analyzing dog photos:
 * 1. Vision Analysis: Uses OpenAI Vision to analyze the dog's body language
 * 2. Retrieval: Queries Pinecone for relevant knowledge base articles
 * 3. Generation: Creates both short_summary and detailed_report
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import OpenAI from 'https://esm.sh/openai@4.20.1';
import { Pinecone } from 'https://esm.sh/@pinecone-database/pinecone@1.1.2';

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
  short_summary: string;
  detailed_report: string;
  sourceUrl: string;
  confidence: number;
  analysis: VisionAnalysis;
}

// Initialize clients
const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY'),
});

const pinecone = new Pinecone({
  apiKey: Deno.env.get('PINECONE_API_KEY') || '',
  environment: Deno.env.get('PINECONE_ENVIRONMENT') || 'gcp-starter',
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

    // Parse the JSON response - handle markdown code blocks
    let jsonContent = content.trim();

    // Remove markdown code blocks if present
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    // Clean up common JSON issues
    jsonContent = jsonContent
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .replace(/\n/g, '\\n') // Escape newlines
      .replace(/\r/g, '\\r') // Escape carriage returns
      .replace(/\t/g, '\\t'); // Escape tabs

    console.log('Cleaned JSON content:', jsonContent);

    let result;
    try {
      result = JSON.parse(jsonContent);
    } catch (err) {
      console.error('Failed to parse LLM response:', err, jsonContent);
      // Try to extract JSON using regex as fallback
      const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          result = JSON.parse(jsonMatch[0]);
        } catch (fallbackErr) {
          console.error('Fallback JSON parsing also failed:', fallbackErr);
          throw new Error('Failed to parse LLM response as JSON after cleanup attempts.');
        }
      } else {
        throw new Error('Failed to parse LLM response as JSON.');
      }
    }
    console.log('Parsed result:', result);

    return result;
  } catch (error) {
    console.error('Vision analysis error:', error);
    throw new Error(`Vision analysis failed: ${(error as Error).message}`);
  }
}

/**
 * Step 2: Knowledge Base Retrieval
 * Queries Pinecone for relevant dog behavior knowledge
 */
async function retrieveKnowledge(analysis: VisionAnalysis): Promise<{
  content: string[];
  scores: number[];
  sources: string[];
}> {
  try {
    const indexName = Deno.env.get('PINECONE_INDEX_NAME') || 'snapdog-kb';
    const index = pinecone.index(indexName);

    // Create embedding for the vision analysis
    const embeddingResponse = await openai.embeddings.create({
      model: 'text-embedding-ada-002',
      input: `${analysis.bodyLanguage} ${analysis.mood} ${analysis.behavior}`,
    });

    const queryEmbedding = embeddingResponse.data[0].embedding;

    // Query Pinecone for similar content
    const queryResponse = await index.query({
      vector: queryEmbedding,
      topK: 5,
      includeMetadata: true,
    });

    // Extract content, scores, and sources
    const content: string[] = [];
    const scores: number[] = [];
    const sources: string[] = [];

    queryResponse.matches?.forEach((match) => {
      if (match.metadata?.content) {
        content.push(match.metadata.content as string);
        scores.push(match.score || 0);
        sources.push((match.metadata.source as string) || 'Unknown');
      }
    });

    return { content, scores, sources };
  } catch (error) {
    console.error('Knowledge retrieval error:', error);
    // Return empty results if retrieval fails
    return { content: [], scores: [], sources: [] };
  }
}

/**
 * Step 3: Generate Vibe Check Response
 * Creates both short_summary and detailed_report
 */
async function generateVibeCheck(
  analysis: VisionAnalysis,
  knowledgeData: { content: string[]; scores: number[]; sources: string[] },
): Promise<{ short_summary: string; detailed_report: string }> {
  const { content, scores, sources } = knowledgeData;
  const knowledgeBaseText = content.join('\n\n');

  const prompt = `
You are a certified dog behavior expert and veterinarian analyzing a dog's emotional state and behavior through image analysis.

VISION ANALYSIS:
- Body Language: ${analysis.bodyLanguage}
- Mood: ${analysis.mood}
- Behavior: ${analysis.behavior}
- Confidence: ${analysis.confidence}

RELEVANT KNOWLEDGE BASE CONTENT (from scientific sources):
${knowledgeBaseText}

SOURCES: ${sources.join(', ')}

Based on the vision analysis and the scientific knowledge base content, provide TWO outputs:

1. SHORT_SUMMARY: Generate a playful, descriptive 1 sentence summary (more than 5 words but capped at 15 words) of the dog's vibe (e.g., "A happy pup, calm and curious about the world.", "A curious explorer, ready for adventure!", "Happy tail wagger, soaking in the sights.")

2. DETAILED_REPORT: Generate a structured markdown report explaining the dog's emotional state, body language, and context. Structure it as:

## 🐕 VIBE CHECK REPORT

### Emotional State Assessment

[Analyze the dog's likely emotional state based on visual cues]

### Body Language Breakdown

[Detail specific body language indicators and their meanings]

### Behavioral Context

[What might be happening in this situation?]

### Comfort & Well-being Level

[Rate comfort level and explain indicators]

### Scientific Backing

[Reference specific knowledge base content to support your analysis]

### Recommendations

[Provide actionable advice for the dog's well-being or interaction]

**IMPORTANT:**
- Each header (lines starting with ## or ###) must be on its own line, with a blank line before and after.
- Each paragraph must start on a new line after its header, with a blank line before the next header.
- Never split words or headers across lines. Never output stray single letters or broken words.
- The markdown must be valid and render cleanly in any markdown viewer.

Make the detailed report:
- Friendly and accessible to dog owners
- Scientifically accurate based on the knowledge base
- Specific to the visual cues observed
- Helpful and actionable

Return ONLY a JSON object with this structure:
{
  "short_summary": "Your playful 1-2 sentence summary here",
  "detailed_report": "Your complete markdown report here"
}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content:
            'You are a knowledgeable, certified dog behavior expert and veterinarian who provides scientifically-backed, friendly insights about dog emotions and behavior. Always base your analysis on observable evidence and scientific knowledge.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) {
      throw new Error('No response from generation');
    }

    console.log('Raw response from GPT:', response);

    // Parse the JSON response - handle markdown code blocks
    let jsonContent = response.trim();

    // Remove markdown code blocks if present
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.replace(/^```json\n/, '').replace(/\n```$/, '');
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.replace(/^```\n/, '').replace(/\n```$/, '');
    }

    // Clean up common JSON issues
    jsonContent = jsonContent
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
      .replace(/\n/g, '\\n') // Escape newlines
      .replace(/\r/g, '\\r') // Escape carriage returns
      .replace(/\t/g, '\\t'); // Escape tabs

    console.log('Cleaned JSON content:', jsonContent);

    let result;
    try {
      result = JSON.parse(jsonContent);
    } catch (err) {
      console.error('Failed to parse LLM response:', err, jsonContent);
      // Try to extract JSON using regex as fallback
      const jsonMatch = jsonContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          result = JSON.parse(jsonMatch[0]);
        } catch (fallbackErr) {
          console.error('Fallback JSON parsing also failed:', fallbackErr);
          throw new Error('Failed to parse LLM response as JSON after cleanup attempts.');
        }
      } else {
        throw new Error('Failed to parse LLM response as JSON.');
      }
    }
    console.log('Parsed result:', result);

    return {
      short_summary: result.short_summary,
      detailed_report: result.detailed_report,
    };
  } catch (error) {
    console.error('Generation error:', error);
    throw new Error(`Vibe check generation failed: ${(error as Error).message}`);
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
    console.log('🚀 Check Vibe RAG function started');

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
    console.log('✅ Vision analysis complete');

    // Step 2: Knowledge Retrieval
    console.log('📚 Step 2: Retrieving knowledge...');
    const knowledgeData = await retrieveKnowledge(analysis);
    console.log(`✅ Retrieved ${knowledgeData.content.length} knowledge base entries`);

    // Step 3: Generate Vibe Check
    console.log('🤖 Step 3: Generating vibe check...');
    const vibeCheck = await generateVibeCheck(analysis, knowledgeData);
    console.log('✅ Vibe check generation complete');

    // Prepare response
    const response: VibeCheckResponse = {
      short_summary: vibeCheck.short_summary,
      detailed_report: vibeCheck.detailed_report,
      sourceUrl: knowledgeData.sources[0] || 'https://example.com/knowledge-base',
      confidence: analysis.confidence,
      analysis: analysis,
    };

    console.log('✅ Check Vibe RAG completed successfully');

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
        error: 'Check Vibe RAG failed',
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
