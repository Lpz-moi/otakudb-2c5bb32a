-- ===========================================
-- Activity Log Table for Recent Activity Feature
-- ===========================================

-- Create activity_log table to track user actions
CREATE TABLE public.activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    anime_id INTEGER NOT NULL,
    anime_title TEXT NOT NULL,
    anime_image TEXT,
    action_type TEXT NOT NULL CHECK (action_type IN ('added', 'completed', 'status_changed', 'rating_changed')),
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX idx_activity_log_user_id ON public.activity_log(user_id);
CREATE INDEX idx_activity_log_created_at ON public.activity_log(created_at DESC);
CREATE INDEX idx_activity_log_user_created ON public.activity_log(user_id, created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only view their own activity
CREATE POLICY "Users can view their own activity"
ON public.activity_log FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activity"
ON public.activity_log FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- ===========================================
-- Trigger Function: Auto-log anime list changes
-- ===========================================
CREATE OR REPLACE FUNCTION public.log_anime_activity()
RETURNS TRIGGER AS $$
BEGIN
    -- Log when anime is added
    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.activity_log (
            user_id, anime_id, anime_title, anime_image, action_type, new_value
        ) VALUES (
            NEW.user_id,
            NEW.anime_id,
            NEW.anime_title,
            NEW.anime_image,
            'added',
            NEW.status
        );
    -- Log when anime status changes
    ELSIF TG_OP = 'UPDATE' THEN
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            INSERT INTO public.activity_log (
                user_id, anime_id, anime_title, anime_image, action_type, old_value, new_value
            ) VALUES (
                NEW.user_id,
                NEW.anime_id,
                NEW.anime_title,
                NEW.anime_image,
                'status_changed',
                OLD.status,
                NEW.status
            );
        END IF;
        -- Log rating changes
        IF OLD.rating IS DISTINCT FROM NEW.rating THEN
            INSERT INTO public.activity_log (
                user_id, anime_id, anime_title, anime_image, action_type, old_value, new_value
            ) VALUES (
                NEW.user_id,
                NEW.anime_id,
                NEW.anime_title,
                NEW.anime_image,
                'rating_changed',
                OLD.rating::TEXT,
                NEW.rating::TEXT
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on anime_lists table
DROP TRIGGER IF EXISTS anime_activity_trigger ON public.anime_lists;
CREATE TRIGGER anime_activity_trigger
AFTER INSERT OR UPDATE ON public.anime_lists
FOR EACH ROW
EXECUTE FUNCTION public.log_anime_activity();
