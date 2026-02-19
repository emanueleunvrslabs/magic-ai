
-- Table to store OTP codes for WhatsApp auth
CREATE TABLE public.phone_otps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '5 minutes'),
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.phone_otps ENABLE ROW LEVEL SECURITY;

-- Allow edge functions (service role) to manage OTPs, no public access
-- No public policies needed since edge functions use service role key

-- Index for fast lookups
CREATE INDEX idx_phone_otps_phone_code ON public.phone_otps (phone, otp_code);

-- Auto-cleanup old OTPs (older than 10 minutes)
CREATE OR REPLACE FUNCTION public.cleanup_expired_otps()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM public.phone_otps WHERE expires_at < now() - interval '10 minutes';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER trigger_cleanup_otps
AFTER INSERT ON public.phone_otps
FOR EACH STATEMENT
EXECUTE FUNCTION public.cleanup_expired_otps();
