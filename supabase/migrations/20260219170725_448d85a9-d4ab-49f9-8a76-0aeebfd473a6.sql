-- Deny all direct access to phone_otps (only edge functions with service role should access)
CREATE POLICY "Deny all select on phone_otps"
  ON public.phone_otps FOR SELECT
  USING (false);

CREATE POLICY "Deny all insert on phone_otps"
  ON public.phone_otps FOR INSERT
  WITH CHECK (false);

CREATE POLICY "Deny all update on phone_otps"
  ON public.phone_otps FOR UPDATE
  USING (false);

CREATE POLICY "Deny all delete on phone_otps"
  ON public.phone_otps FOR DELETE
  USING (false);