# Check Vibe RAG Function

This Supabase Edge Function provides a Retrieval-Augmented Generation (RAG) pipeline for analyzing dog photos and providing "vibe checks".

## Features

- **Vision Analysis**: Analyzes dog photos using AI vision
- **Knowledge Retrieval**: Queries a knowledge base for relevant information
- **Response Generation**: Creates engaging, educational vibe checks

## API

### Endpoint

`POST /functions/v1/check-vibe-rag`

### Request Body

```json
{
  "imageBase64": "base64_encoded_image",
  "userId": "user_id"
}
```

### Response

```json
{
  "vibeCheck": "Your dog looks happy and playful! 🐕",
  "sourceUrl": "https://example.com/source",
  "confidence": 0.85,
  "analysis": {
    "bodyLanguage": "Relaxed posture, wagging tail",
    "mood": "Happy",
    "behavior": "Playful",
    "confidence": 0.85
  }
}
```

## Environment Variables

Required environment variables (set in Supabase dashboard):

- `OPENAI_API_KEY`: OpenAI API key for vision analysis and text generation
- `PINECONE_API_KEY`: Pinecone API key for vector search
- `PINECONE_INDEX_NAME`: Name of the Pinecone index containing knowledge base

Optional:

- `LANGSMITH_API_KEY`: LangSmith API key for observability
- `LANGSMITH_PROJECT`: LangSmith project name

## Development

To deploy:

```bash
npx supabase functions deploy check-vibe-rag
```

To test locally (requires Docker):

```bash
npx supabase functions serve check-vibe-rag
```
