-- Add Vibe Check metadata columns to stories table
ALTER TABLE stories 
ADD COLUMN IF NOT EXISTS vibe_check_summary TEXT,
ADD COLUMN IF NOT EXISTS vibe_check_confidence DECIMAL(3,2) CHECK (vibe_check_confidence >= 0 AND vibe_check_confidence <= 1),
ADD COLUMN IF NOT EXISTS vibe_check_source_url TEXT;

-- Add index for Vibe Check queries
CREATE INDEX IF NOT EXISTS idx_stories_vibe_check_summary ON stories(vibe_check_summary) WHERE vibe_check_summary IS NOT NULL; 