import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { phone, otp } = await req.json();

    if (!phone || !otp || typeof phone !== 'string' || typeof otp !== 'string') {
      return new Response(JSON.stringify({ error: 'Phone and OTP are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const cleanPhone = phone.replace(/[^\d]/g, '');

    console.log('Verifying OTP for phone:', cleanPhone, 'otp:', otp);

    // Find valid OTP
    const { data: otpRecord, error: dbError } = await supabase
      .from('phone_otps')
      .select('*')
      .eq('phone', cleanPhone)
      .eq('otp_code', otp)
      .eq('verified', false)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    console.log('OTP lookup result:', { otpRecord, dbError });

    if (dbError || !otpRecord) {
      return new Response(JSON.stringify({ error: 'Invalid or expired OTP' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Mark OTP as verified
    await supabase
      .from('phone_otps')
      .update({ verified: true })
      .eq('id', otpRecord.id);

    // Create or get user via Supabase Auth admin
    // First try to find existing user by phone
    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(
      (u) => u.phone === cleanPhone
    );

    let userId: string;

    if (existingUser) {
      userId = existingUser.id;
    } else {
      // Create new user with phone
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        phone: cleanPhone,
        phone_confirm: true,
      });

      if (createError || !newUser?.user) {
        console.error('Failed to create user:', createError);
        return new Response(JSON.stringify({ error: 'Failed to create user account' }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      userId = newUser.user.id;
    }

    // Generate a session link for the user
    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: `${cleanPhone.replace('+', '')}@phone.magic-ai.local`,
    });

    // Alternative: use admin to create a session directly
    // Since generateLink requires email, we'll use a workaround:
    // Create user with email derived from phone, then generate magic link

    // Let's use a simpler approach - update user email and generate link
    if (existingUser) {
      // For existing users, we need to generate a new session
      // Use signInWithPassword by setting a deterministic password
    }

    // Simplest approach: use admin.generateLink with email-based identity
    const fakeEmail = `wa_${cleanPhone.replace('+', '')}@magic-ai.app`;
    
    // Ensure user has this email
    await supabase.auth.admin.updateUser(userId, {
      email: fakeEmail,
      email_confirm: true,
    });

    const { data: magicLink, error: mlError } = await supabase.auth.admin.generateLink({
      type: 'magiclink',
      email: fakeEmail,
    });

    if (mlError || !magicLink) {
      console.error('Failed to generate magic link:', mlError);
      return new Response(JSON.stringify({ error: 'Authentication failed' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Extract the token from the magic link
    const properties = magicLink.properties;

    return new Response(JSON.stringify({ 
      success: true,
      token_hash: properties?.hashed_token,
      email: fakeEmail,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('verify-otp error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
