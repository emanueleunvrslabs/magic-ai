import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const IMAGE_COST = 0.50;

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { useStoredKey, userApiKey, ...params } = body;

    // Determine which FAL key to use and whether to deduct credits
    let falKey: string;
    let shouldDeductCredits = false;
    let userId: string | null = null;

    // Always authenticate the user
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );
    const authHeader = req.headers.get("Authorization");

    if (useStoredKey || (!userApiKey && authHeader)) {
      // Must authenticate to use stored key or platform key
      if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Authentication required' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const token = authHeader.replace("Bearer ", "");
      const { data: userData } = await supabase.auth.getUser(token);
      if (!userData.user) {
        return new Response(JSON.stringify({ error: 'Invalid token' }), {
          status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      userId = userData.user.id;

      const adminClient = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      if (useStoredKey) {
        // Retrieve user's own API key server-side (never exposed to client)
        const { data: keyRow } = await adminClient
          .from("user_api_keys")
          .select("api_key")
          .eq("user_id", userId)
          .eq("provider", "fal")
          .eq("is_valid", true)
          .limit(1)
          .single();

        if (!keyRow?.api_key) {
          return new Response(JSON.stringify({ error: 'No valid fal.ai key found' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        falKey = keyRow.api_key;
      } else {
        // Use platform key — deduct credits
        const platformKey = Deno.env.get('FAL_KEY');
        if (!platformKey) {
          return new Response(JSON.stringify({ error: 'FAL_KEY not configured' }), {
            status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        falKey = platformKey;
        shouldDeductCredits = true;

        const { data: credits } = await adminClient
          .from("user_credits")
          .select("balance")
          .eq("user_id", userId)
          .single();

        if (!credits || credits.balance < IMAGE_COST) {
          return new Response(JSON.stringify({ error: 'Credito insufficiente' }), {
            status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      }
    } else if (userApiKey) {
      // Legacy: user provided key directly (deprecated path)
      falKey = userApiKey;
    } else {
      return new Response(JSON.stringify({ error: 'Authentication required' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { mode } = params as { mode?: string };
    const endpoint = mode === 'edit'
      ? 'https://queue.fal.run/fal-ai/nano-banana-pro/edit'
      : 'https://queue.fal.run/fal-ai/nano-banana-pro';

    // Submit to queue
    const submitRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!submitRes.ok) {
      const err = await submitRes.text();
      console.error('fal.ai submit error:', submitRes.status, err);
      return new Response(JSON.stringify({ error: `fal.ai error: ${err}` }), {
        status: submitRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { request_id } = await submitRes.json();

    // Poll for result
    const baseUrl = mode === 'edit'
      ? `https://queue.fal.run/fal-ai/nano-banana-pro/edit/requests/${request_id}`
      : `https://queue.fal.run/fal-ai/nano-banana-pro/requests/${request_id}`;

    let attempts = 0;
    const maxAttempts = 120;

    while (attempts < maxAttempts) {
      const statusRes = await fetch(`${baseUrl}/status`, {
        headers: { 'Authorization': `Key ${falKey}` },
      });
      const statusData = await statusRes.json();

      if (statusData.status === 'COMPLETED') {
        const resultRes = await fetch(baseUrl, {
          headers: { 'Authorization': `Key ${falKey}` },
        });
        const result = await resultRes.json();

        // Deduct credits after successful generation
        if (shouldDeductCredits && userId) {
          const adminClient = createClient(
            Deno.env.get("SUPABASE_URL") ?? "",
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
          );
          const { data: currentCredits } = await adminClient
            .from("user_credits")
            .select("balance")
            .eq("user_id", userId)
            .single();
          if (currentCredits) {
            await adminClient
              .from("user_credits")
              .update({ balance: currentCredits.balance - IMAGE_COST, updated_at: new Date().toISOString() })
              .eq("user_id", userId);
          }
        }

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (statusData.status === 'FAILED') {
        console.error('fal.ai generation failed:', JSON.stringify(statusData));
        return new Response(JSON.stringify({ error: 'Generation failed', details: statusData }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await new Promise(r => setTimeout(r, 1000));
      attempts++;
    }

    return new Response(JSON.stringify({ error: 'Timeout waiting for result' }), {
      status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
