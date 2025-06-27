# Dog Behavior Knowledge Base

This directory contains curated articles about dog behavior, body language, and communication from trusted veterinary and canine behavior sources.

## Articles Included

### 1. Understanding Dog Body Language (VCA Hospitals)

- **File:** `dog-body-language-vca.json`
- **Topics:** Body language, tail position, ear position, eye contact, facial expressions, stress signals, happiness indicators
- **Key Content:** Comprehensive guide to interpreting dog body language including tail, ears, eyes, posture, and facial expressions

### 2. Understanding Dog Play Behavior (American Kennel Club)

- **File:** `dog-play-behavior-akc.json`
- **Topics:** Play behavior, play bow, play signals, healthy play, warning signs, play styles, breed-specific play
- **Key Content:** Detailed explanation of play behavior including the play bow, play face, vocalizations, and signs of healthy vs. problematic play

### 3. Recognizing Stress and Anxiety in Dogs (ASPCA)

- **File:** `dog-stress-signals-aspca.json`
- **Topics:** Stress signals, anxiety, calming signals, behavioral changes, environmental stressors, chronic stress, stress management
- **Key Content:** Comprehensive guide to identifying stress and anxiety signals, environmental stressors, and management strategies

### 4. How to Tell If Your Dog Is Happy (PetMD)

- **File:** `dog-happiness-signals-petmd.json`
- **Topics:** Happiness, contentment, positive body language, social behavior, play behavior, trust signals, breed-specific indicators
- **Key Content:** Detailed guide to recognizing signs of happiness and contentment in dogs

### 5. Understanding Breed-Specific Dog Behaviors (American Kennel Club)

- **File:** `breed-specific-behaviors-akc.json`
- **Topics:** Breed-specific behaviors, herding breeds, working breeds, sporting breeds, terrier breeds, toy breeds, hound breeds, giant breeds, mixed breeds
- **Key Content:** Comprehensive guide to how different breed groups communicate and behave

### 6. Canine Body Language: A Comprehensive Guide for Animal Welfare Professionals (ASPCA Pro)

- **File:** `canine-body-language-aspca-pro.json`
- **Topics:** Body language, stress signals, aggression warning, play behavior, calming signals, assessment guidelines, practical applications
- **Key Content:** Professional guide for animal welfare workers covering facial expressions, body posture, tail position, movement patterns, and practical applications

### 7. Dogs' Body Language During Learning: Scientific Research on Operant Conditioning (PMC Research)

- **File:** `dog-learning-body-language-research.json`
- **Topics:** Learning achievement, operant conditioning, scientific research, body language patterns, training effectiveness, eye position, ear position, tail position, mouth position
- **Key Content:** Evidence-based research on how specific body language patterns correlate with learning achievement during training sessions

### 8. Canine Body Language: A Photographic Guide to Interpreting Dog Behavior (Brenda Aloff)

- **File:** `canine-body-language-photographic-guide.json`
- **Topics:** Photographic guide, visual learning, facial expressions, body posture, tail position, ear position, eye expressions, play behavior, stress signals, aggression warning, context interpretation
- **Key Content:** Comprehensive photographic guide with detailed visual analysis of canine body language, covering facial expressions, body postures, and behavioral interpretation

## JSON Structure

Each article follows this structure:

```json
{
  "title": "Article Title",
  "source_url": "Original source URL",
  "content": "Full article content with markdown formatting",
  "topics": ["array", "of", "relevant", "topics"],
  "source": "Source organization name",
  "date_added": "YYYY-MM-DD"
}
```

## Content Quality

All articles are:

- From reputable veterinary and canine behavior organizations
- Focused on specific, actionable body language cues
- Written in clear, accessible language
- Structured for easy parsing and chunking
- Free of HTML markup and advertisements
- Include both practical guides and scientific research
- Cover visual learning and photographic documentation

## Usage

These articles will be:

1. Chunked into smaller, meaningful segments
2. Embedded using OpenAI's text-embedding-ada-002 model
3. Stored in the Pinecone vector database
4. Retrieved during Vibe Check analysis to provide context for AI-generated interpretations

## Sources

- **VCA Hospitals:** Professional veterinary organization
- **American Kennel Club:** Leading canine organization
- **ASPCA:** Animal welfare and behavior authority
- **PetMD:** Veterinary information resource
- **ASPCA Pro:** Professional animal welfare resources
- **PMC Research:** Peer-reviewed scientific research
- **Brenda Aloff - Dogwise Publishing:** Expert canine behaviorist and author

## Next Steps

1. Review and validate content accuracy
2. Add additional articles if needed
3. Create embedding and ingestion script
4. Test retrieval and relevance scoring
