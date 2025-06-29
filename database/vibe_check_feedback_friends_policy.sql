-- Migration: Allow users to view vibe checks from their friends
-- This policy extends the existing RLS to allow viewing friends' vibe checks

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view own feedback" ON vibe_check_feedback;

-- Create a new policy that allows viewing own vibe checks AND friends' vibe checks
CREATE POLICY "Users can view own and friends' feedback" ON vibe_check_feedback
    FOR SELECT USING (
        -- Users can always see their own vibe checks
        auth.uid() = user_id 
        OR 
        -- Users can see vibe checks from users they follow (friends)
        EXISTS (
            SELECT 1 FROM friend_requests 
            WHERE (
                (from_user_id = auth.uid() AND to_user_id = user_id AND status = 'accepted')
                OR 
                (from_user_id = user_id AND to_user_id = auth.uid() AND status = 'accepted')
            )
        )
    );

-- Add an index to improve performance for friend relationship lookups
CREATE INDEX IF NOT EXISTS idx_friend_requests_bidirectional 
ON friend_requests(from_user_id, to_user_id, status) 
WHERE status = 'accepted';

-- Add a comment explaining the policy
COMMENT ON POLICY "Users can view own and friends' feedback" ON vibe_check_feedback IS 
'Allows users to view their own vibe checks and vibe checks from users they follow (friends)'; 