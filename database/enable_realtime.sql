-- Enable Realtime for stories table
-- Run this in your Supabase SQL editor

-- Enable Realtime for the stories table
ALTER PUBLICATION supabase_realtime ADD TABLE public.stories;

-- Verify Realtime is enabled
SELECT 
    schemaname,
    tablename,
    pubname
FROM pg_publication_tables 
WHERE tablename = 'stories'; 