-- Featured Accounts Schema
-- Add is_featured column to existing profiles table
-- Run this in your Supabase SQL editor

-- Add is_featured column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- Add index for better performance when querying featured accounts
CREATE INDEX IF NOT EXISTS idx_profiles_is_featured ON public.profiles(is_featured);

-- Add index for featured accounts with recent activity (combines is_featured with updated_at)
CREATE INDEX IF NOT EXISTS idx_profiles_featured_recent ON public.profiles(is_featured, updated_at) 
WHERE is_featured = true;

-- Update RLS policies to allow viewing featured accounts
-- Users can view featured accounts (in addition to existing policies)
CREATE POLICY "Users can view featured accounts" ON public.profiles
    FOR SELECT TO authenticated
    USING (is_featured = true);

-- Only admins can update featured status (this policy should be more restrictive in production)
-- For now, we'll allow the feature to be updated by the user themselves for testing
-- In production, you might want to restrict this to admin users only
CREATE POLICY "Users can update their own featured status" ON public.profiles
    FOR UPDATE TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Create a function to get featured accounts with their recent stories
CREATE OR REPLACE FUNCTION get_featured_accounts_with_stories()
RETURNS TABLE (
    user_id UUID,
    username TEXT,
    avatar_url TEXT,
    bio TEXT,
    is_featured BOOLEAN,
    story_count INTEGER,
    latest_story_created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id as user_id,
        p.username,
        p.avatar_url,
        p.bio,
        p.is_featured,
        COUNT(s.id)::INTEGER as story_count,
        MAX(s.created_at) as latest_story_created_at
    FROM public.profiles p
    LEFT JOIN public.stories s ON p.id = s.user_id 
        AND s.expires_at > NOW() 
        AND s.is_public = true
    WHERE p.is_featured = true
    GROUP BY p.id, p.username, p.avatar_url, p.bio, p.is_featured
    ORDER BY latest_story_created_at DESC NULLS LAST, p.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION get_featured_accounts_with_stories() TO authenticated;

-- Create a view for easier querying of featured accounts
CREATE OR REPLACE VIEW featured_accounts_view AS
SELECT 
    p.id,
    p.username,
    p.avatar_url,
    p.bio,
    p.is_featured,
    p.updated_at,
    COUNT(s.id) as active_story_count
FROM public.profiles p
LEFT JOIN public.stories s ON p.id = s.user_id 
    AND s.expires_at > NOW() 
    AND s.is_public = true
WHERE p.is_featured = true
GROUP BY p.id, p.username, p.avatar_url, p.bio, p.is_featured, p.updated_at
ORDER BY p.updated_at DESC;

-- Grant select permission on the view
GRANT SELECT ON featured_accounts_view TO authenticated; 