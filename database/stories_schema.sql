-- Stories Schema
-- Run this in your Supabase SQL editor

-- Create stories table
CREATE TABLE IF NOT EXISTS public.stories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('photo', 'video')),
    timer INTEGER DEFAULT 3 CHECK (timer >= 1 AND timer <= 10), -- Duration in seconds for photos
    is_public BOOLEAN DEFAULT true,
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours'),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_stories_user_id ON public.stories(user_id);
CREATE INDEX IF NOT EXISTS idx_stories_created_at ON public.stories(created_at);
CREATE INDEX IF NOT EXISTS idx_stories_expires_at ON public.stories(expires_at);
CREATE INDEX IF NOT EXISTS idx_stories_is_public ON public.stories(is_public);

-- Enable Row Level Security
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

-- RLS Policies for stories table

-- Users can view public stories and their own stories
CREATE POLICY "Users can view public stories and their own stories" ON public.stories
    FOR SELECT TO authenticated
    USING (
        is_public = true OR 
        auth.uid() = user_id
    );

-- Users can create their own stories
CREATE POLICY "Users can create their own stories" ON public.stories
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own stories
CREATE POLICY "Users can update their own stories" ON public.stories
    FOR UPDATE TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own stories
CREATE POLICY "Users can delete their own stories" ON public.stories
    FOR DELETE TO authenticated
    USING (auth.uid() = user_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_stories_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for stories table
CREATE TRIGGER update_stories_updated_at 
    BEFORE UPDATE ON public.stories 
    FOR EACH ROW 
    EXECUTE FUNCTION update_stories_updated_at_column();

-- Create a function to clean up expired stories (optional - for maintenance)
CREATE OR REPLACE FUNCTION cleanup_expired_stories()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM public.stories 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a cron job to clean up expired stories daily (optional)
-- This requires pg_cron extension to be enabled in Supabase
-- SELECT cron.schedule('cleanup-expired-stories', '0 2 * * *', 'SELECT cleanup_expired_stories();'); 