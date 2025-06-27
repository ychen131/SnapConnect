# Vibe Check RAG Edge Function

This Supabase Edge Function implements the complete RAG (Retrieval-Augmented Generation) pipeline for analyzing dog photos and providing "vibe checks".

## Function Overview

The function performs a 3-step process:

1. **Vision Analysis**: Uses OpenAI Vision API to analyze the dog's body language
2. **Knowledge Retrieval**: Queries Pinecone vector database for relevant articles
3. **Response Generation**: Creates the final "vibe check" using retrieved knowledge

## Environment Variables Required

Add these to your Supabase project secrets:

```bash
# OpenAI API
OPENAI_API_KEY=your_openai_api_key

# Pinecone
PINECONE_API_KEY=your_pinecone_api_key
PINECONE_INDEX_NAME=snapdog-kb

# LangSmith (for observability)
LANGSMITH_API_KEY=your_langsmith_api_key
LANGSMITH_PROJECT=snapdog-vibe-check
```

## API Endpoint

**URL**: `https://your-project.supabase.co/functions/v1/vibe-check-rag`

**Method**: `POST`

**Headers**:

```
Content-Type: application/json
Authorization: Bearer your_anon_key
```

## Request Body

```json
{
  "imageBase64": "base64_encoded_image_string",
  "userId": "user_id_string"
}
```

## Response Format

```json
{
  "vibeCheck": "Your dog is showing classic play behavior with that wagging tail and relaxed posture! They're clearly in a happy, social mood and ready for some fun.",
  "sourceUrl": "https://www.akc.org/expert-advice/health/dog-play-behavior/",
  "confidence": 0.85,
  "analysis": {
    "bodyLanguage": "Tail is wagging, ears are forward, mouth is slightly open with tongue visible",
    "mood": "happy and playful",
    "behavior": "showing interest and readiness to play",
    "confidence": 0.85
  }
}
```

## Deployment

1. **Deploy the function**:

   ```bash
   supabase functions deploy vibe-check-rag
   ```

2. **Set environment variables**:

   ```bash
   supabase secrets set OPENAI_API_KEY=your_key
   supabase secrets set PINECONE_API_KEY=your_key
   supabase secrets set PINECONE_INDEX_NAME=snapdog-kb
   supabase secrets set LANGSMITH_API_KEY=your_key
   supabase secrets set LANGSMITH_PROJECT=snapdog-vibe-check
   ```

3. **Test the function**:
   ```

   ```
