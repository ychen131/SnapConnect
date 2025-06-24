-- SnapConnect Database Schema
-- Run this in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types
CREATE TYPE media_type AS ENUM ('photo', 'video');
CREATE TYPE friendship_status AS ENUM ('pending', 'accepted', 'blocked');

-- Profiles table (extends Supabase auth.users)
CREATE TABLE profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(100),
    bio TEXT,
    avatar_url TEXT,
    snapcode_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Friendships table (many-to-many relationship between users)
CREATE TABLE friendships (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    requester_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    addressee_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    status friendship_status DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(requester_id, addressee_id)
);

-- Stories table (ephemeral content that expires after 24 hours)
CREATE TABLE stories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    media_url TEXT NOT NULL,
    media_type media_type NOT NULL,
    caption TEXT,
    duration INTEGER DEFAULT 10, -- seconds
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '24 hours')
);

-- Snaps table (direct messages between users)
CREATE TABLE snaps (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    receiver_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
    media_url TEXT NOT NULL,
    media_type media_type NOT NULL,
    caption TEXT,
    duration INTEGER DEFAULT 10, -- seconds
    is_opened BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '10 seconds')
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_friendships_requester ON friendships(requester_id);
CREATE INDEX idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX idx_friendships_status ON friendships(status);
CREATE INDEX idx_stories_user_id ON stories(user_id);
CREATE INDEX idx_stories_expires_at ON stories(expires_at);
CREATE INDEX idx_snaps_sender_id ON snaps(sender_id);
CREATE INDEX idx_snaps_receiver_id ON snaps(receiver_id);
CREATE INDEX idx_snaps_expires_at ON snaps(expires_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_friendships_updated_at BEFORE UPDATE ON friendships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE snaps ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can view other profiles" ON profiles FOR SELECT USING (true);

-- Friendships policies
CREATE POLICY "Users can view their own friendships" ON friendships FOR SELECT USING (auth.uid() = requester_id OR auth.uid() = addressee_id);
CREATE POLICY "Users can create friendship requests" ON friendships FOR INSERT WITH CHECK (auth.uid() = requester_id);
CREATE POLICY "Users can update their own friendships" ON friendships FOR UPDATE USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- Stories policies
CREATE POLICY "Users can view stories from friends" ON stories FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM friendships 
        WHERE (requester_id = auth.uid() AND addressee_id = stories.user_id AND status = 'accepted')
        OR (addressee_id = auth.uid() AND requester_id = stories.user_id AND status = 'accepted')
    )
    OR stories.user_id = auth.uid()
);
CREATE POLICY "Users can create their own stories" ON stories FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own stories" ON stories FOR DELETE USING (auth.uid() = user_id);

-- Snaps policies
CREATE POLICY "Users can view snaps sent to them" ON snaps FOR SELECT USING (auth.uid() = receiver_id);
CREATE POLICY "Users can view snaps they sent" ON snaps FOR SELECT USING (auth.uid() = sender_id);
CREATE POLICY "Users can create snaps" ON snaps FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can update snaps they received" ON snaps FOR UPDATE USING (auth.uid() = receiver_id);

-- Create a function to automatically create a profile when a user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, email)
    VALUES (NEW.id, NEW.raw_user_meta_data->>'username', NEW.email);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a function to clean up expired content
CREATE OR REPLACE FUNCTION cleanup_expired_content()
RETURNS void AS $$
BEGIN
    -- Delete expired stories
    DELETE FROM stories WHERE expires_at < NOW();
    
    -- Delete expired snaps
    DELETE FROM snaps WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;    