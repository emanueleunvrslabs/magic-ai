-- Remove direct client UPDATE access to user_credits
-- All balance modifications must go through edge functions (stripe-webhook, fal-ai-generate, fal-ai-video)
-- which use the service role key and bypass RLS.
DROP POLICY IF EXISTS "Users can update their own credits" ON public.user_credits;