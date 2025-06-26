-- Friend Requests and Friendships Schema
-- Run this in your Supabase SQL editor

-- Create friend_requests table
CREATE TABLE IF NOT EXISTS public.friend_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    from_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    to_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(from_user_id, to_user_id)
);

-- Create friendships table for easier querying
CREATE TABLE IF NOT EXISTS public.friendships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    user2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user1_id, user2_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_friend_requests_from_user_id ON public.friend_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_to_user_id ON public.friend_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON public.friend_requests(status);
CREATE INDEX IF NOT EXISTS idx_friendships_user1_id ON public.friendships(user1_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user2_id ON public.friendships(user2_id);

-- Enable Row Level Security
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- RLS Policies for friend_requests table

-- Users can view friend requests they sent or received
CREATE POLICY "Users can view their own friend requests" ON public.friend_requests
    FOR SELECT TO authenticated
    USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- Users can create friend requests
CREATE POLICY "Users can create friend requests" ON public.friend_requests
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = from_user_id);

-- Users can update friend requests they received
CREATE POLICY "Users can update friend requests they received" ON public.friend_requests
    FOR UPDATE TO authenticated
    USING (auth.uid() = to_user_id)
    WITH CHECK (auth.uid() = to_user_id);

-- Users can delete their own friend requests
CREATE POLICY "Users can delete their own friend requests" ON public.friend_requests
    FOR DELETE TO authenticated
    USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

-- RLS Policies for friendships table

-- Users can view their friendships
CREATE POLICY "Users can view their friendships" ON public.friendships
    FOR SELECT TO authenticated
    USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Users can create friendships (when accepting friend requests)
CREATE POLICY "Users can create friendships" ON public.friendships
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Users can delete their friendships
CREATE POLICY "Users can delete their friendships" ON public.friendships
    FOR DELETE TO authenticated
    USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for friend_requests table
CREATE TRIGGER update_friend_requests_updated_at 
    BEFORE UPDATE ON public.friend_requests 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 