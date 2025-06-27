-- Vibe Check Feedback Database Schema
-- This schema stores user feedback on Vibe Check responses for continuous improvement

-- Enable Row Level Security
ALTER TABLE IF EXISTS vibe_check_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS vibe_check_analytics ENABLE ROW LEVEL SECURITY;

-- Main feedback table
CREATE TABLE IF NOT EXISTS vibe_check_feedback (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL, -- To group related feedback
    image_hash TEXT, -- Hash of the image for deduplication (optional)
    
    -- Request data
    request_timestamp TIMESTAMPTZ DEFAULT NOW(),
    image_size INTEGER, -- Size of uploaded image in bytes
    
    -- Response data
    vibe_check_text TEXT NOT NULL,
    source_url TEXT,
    confidence_score DECIMAL(3,2), -- 0.00 to 1.00
    analysis_data JSONB, -- Store the full vision analysis
    
    -- User feedback
    feedback_type TEXT CHECK (feedback_type IN ('thumbs_up', 'thumbs_down', 'correction')),
    feedback_timestamp TIMESTAMPTZ DEFAULT NOW(),
    feedback_comment TEXT, -- Optional user comment
    
    -- Correction data (if feedback_type = 'correction')
    correction_text TEXT, -- What the user thinks the correct response should be
    correction_reason TEXT, -- Why the user thinks the AI was wrong
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics table for aggregated feedback data
CREATE TABLE IF NOT EXISTS vibe_check_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    date DATE NOT NULL,
    
    -- Usage metrics
    total_requests INTEGER DEFAULT 0,
    successful_requests INTEGER DEFAULT 0,
    failed_requests INTEGER DEFAULT 0,
    
    -- Feedback metrics
    thumbs_up_count INTEGER DEFAULT 0,
    thumbs_down_count INTEGER DEFAULT 0,
    correction_count INTEGER DEFAULT 0,
    
    -- Performance metrics
    avg_response_time_ms INTEGER,
    avg_confidence_score DECIMAL(3,2),
    
    -- Knowledge base metrics
    most_used_sources JSONB, -- Array of source URLs with usage counts
    
    -- Unique constraint to prevent duplicate daily records
    UNIQUE(date),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_vibe_check_feedback_user_id ON vibe_check_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_vibe_check_feedback_session_id ON vibe_check_feedback(session_id);
CREATE INDEX IF NOT EXISTS idx_vibe_check_feedback_timestamp ON vibe_check_feedback(request_timestamp);
CREATE INDEX IF NOT EXISTS idx_vibe_check_feedback_type ON vibe_check_feedback(feedback_type);
CREATE INDEX IF NOT EXISTS idx_vibe_check_analytics_date ON vibe_check_analytics(date);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers to automatically update updated_at
CREATE TRIGGER update_vibe_check_feedback_updated_at 
    BEFORE UPDATE ON vibe_check_feedback 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vibe_check_analytics_updated_at 
    BEFORE UPDATE ON vibe_check_analytics 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update analytics table
CREATE OR REPLACE FUNCTION update_vibe_check_analytics()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert or update analytics for the current date
    INSERT INTO vibe_check_analytics (
        date,
        total_requests,
        successful_requests,
        failed_requests,
        thumbs_up_count,
        thumbs_down_count,
        correction_count,
        avg_confidence_score,
        most_used_sources
    )
    VALUES (
        CURRENT_DATE,
        1,
        CASE WHEN NEW.vibe_check_text IS NOT NULL THEN 1 ELSE 0 END,
        CASE WHEN NEW.vibe_check_text IS NULL THEN 1 ELSE 0 END,
        CASE WHEN NEW.feedback_type = 'thumbs_up' THEN 1 ELSE 0 END,
        CASE WHEN NEW.feedback_type = 'thumbs_down' THEN 1 ELSE 0 END,
        CASE WHEN NEW.feedback_type = 'correction' THEN 1 ELSE 0 END,
        NEW.confidence_score,
        CASE WHEN NEW.source_url IS NOT NULL THEN 
            jsonb_build_array(jsonb_build_object('url', NEW.source_url, 'count', 1))
        ELSE NULL END
    )
    ON CONFLICT (date) DO UPDATE SET
        total_requests = vibe_check_analytics.total_requests + 1,
        successful_requests = vibe_check_analytics.successful_requests + 
            CASE WHEN NEW.vibe_check_text IS NOT NULL THEN 1 ELSE 0 END,
        failed_requests = vibe_check_analytics.failed_requests + 
            CASE WHEN NEW.vibe_check_text IS NULL THEN 1 ELSE 0 END,
        thumbs_up_count = vibe_check_analytics.thumbs_up_count + 
            CASE WHEN NEW.feedback_type = 'thumbs_up' THEN 1 ELSE 0 END,
        thumbs_down_count = vibe_check_analytics.thumbs_down_count + 
            CASE WHEN NEW.feedback_type = 'thumbs_down' THEN 1 ELSE 0 END,
        correction_count = vibe_check_analytics.correction_count + 
            CASE WHEN NEW.feedback_type = 'correction' THEN 1 ELSE 0 END,
        avg_confidence_score = CASE 
            WHEN NEW.confidence_score IS NOT NULL THEN 
                (vibe_check_analytics.avg_confidence_score * (vibe_check_analytics.successful_requests - 1) + NEW.confidence_score) / vibe_check_analytics.successful_requests
            ELSE vibe_check_analytics.avg_confidence_score
        END,
        most_used_sources = CASE 
            WHEN NEW.source_url IS NOT NULL THEN
                COALESCE(vibe_check_analytics.most_used_sources, '[]'::jsonb) || 
                jsonb_build_object('url', NEW.source_url, 'count', 1)
            ELSE vibe_check_analytics.most_used_sources
        END,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update analytics
CREATE TRIGGER trigger_update_vibe_check_analytics
    AFTER INSERT OR UPDATE ON vibe_check_feedback
    FOR EACH ROW EXECUTE FUNCTION update_vibe_check_analytics();

-- Row Level Security Policies

-- Users can only see their own feedback
CREATE POLICY "Users can view own feedback" ON vibe_check_feedback
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own feedback
CREATE POLICY "Users can insert own feedback" ON vibe_check_feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own feedback (for corrections)
CREATE POLICY "Users can update own feedback" ON vibe_check_feedback
    FOR UPDATE USING (auth.uid() = user_id);

-- Analytics are read-only for authenticated users
CREATE POLICY "Authenticated users can view analytics" ON vibe_check_analytics
    FOR SELECT USING (auth.role() = 'authenticated');

-- Service role can manage analytics
CREATE POLICY "Service role can manage analytics" ON vibe_check_analytics
    FOR ALL USING (auth.role() = 'service_role');

-- Views for easier querying

-- Daily feedback summary view
CREATE OR REPLACE VIEW vibe_check_daily_summary AS
SELECT 
    date,
    total_requests,
    successful_requests,
    failed_requests,
    thumbs_up_count,
    thumbs_down_count,
    correction_count,
    CASE 
        WHEN successful_requests > 0 THEN 
            ROUND((thumbs_up_count::DECIMAL / (thumbs_up_count + thumbs_down_count)) * 100, 2)
        ELSE 0 
    END as satisfaction_rate,
    avg_confidence_score,
    most_used_sources
FROM vibe_check_analytics
ORDER BY date DESC;

-- Recent feedback with user info view
CREATE OR REPLACE VIEW vibe_check_recent_feedback AS
SELECT 
    vcf.id,
    vcf.user_id,
    au.email as user_email,
    vcf.session_id,
    vcf.request_timestamp,
    vcf.vibe_check_text,
    vcf.source_url,
    vcf.confidence_score,
    vcf.feedback_type,
    vcf.feedback_timestamp,
    vcf.feedback_comment,
    vcf.correction_text,
    vcf.correction_reason
FROM vibe_check_feedback vcf
LEFT JOIN auth.users au ON vcf.user_id = au.id
ORDER BY vcf.request_timestamp DESC;

-- Comments
COMMENT ON TABLE vibe_check_feedback IS 'Stores user feedback on Vibe Check responses for continuous improvement';
COMMENT ON TABLE vibe_check_analytics IS 'Aggregated analytics data for Vibe Check usage and feedback';
COMMENT ON VIEW vibe_check_daily_summary IS 'Daily summary of Vibe Check usage and feedback metrics';
COMMENT ON VIEW vibe_check_recent_feedback IS 'Recent feedback with user information for admin review';
