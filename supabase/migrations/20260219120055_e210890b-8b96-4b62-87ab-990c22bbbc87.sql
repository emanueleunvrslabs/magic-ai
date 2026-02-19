
-- Table to store generated media (images and videos) per user
CREATE TABLE public.generated_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'video')),
  url TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index for fast user lookups
CREATE INDEX idx_generated_media_user_id ON public.generated_media(user_id);
CREATE INDEX idx_generated_media_created_at ON public.generated_media(created_at DESC);

-- Enable RLS
ALTER TABLE public.generated_media ENABLE ROW LEVEL SECURITY;

-- Users can only see their own media
CREATE POLICY "Users can view their own media"
  ON public.generated_media FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own media
CREATE POLICY "Users can insert their own media"
  ON public.generated_media FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own media
CREATE POLICY "Users can delete their own media"
  ON public.generated_media FOR DELETE
  USING (auth.uid() = user_id);
