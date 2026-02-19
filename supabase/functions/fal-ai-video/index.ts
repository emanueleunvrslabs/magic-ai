import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const VIDEO_COST = 10;

// Veo 3.1 Fast endpoints
const VEO_ENDPOINTS: Record<string, string> = {
  'text-to-video': 'fal-ai/veo3.1/fast',
  'extend-video': 'fal-ai/veo3.1/fast/extend-video',
  'first-last-frame': 'fal-ai/veo3.1/fast/first-last-frame-to-video',
  'image-to-video': 'fal-ai/veo3.1/fast/image-to-video',
  'reference-to-video': 'fal-ai/veo3.1/reference-to-video',
};

// Kling 2.5 endpoints
const KLING_ENDPOINTS: Record<string, string> = {
  'text-to-video': 'fal-ai/kling-video/v2.5-turbo/pro/text-to-video',
  'image-to-video': 'fal-ai/kling-video/v2.5-turbo/pro/image-to-video',
  'video-edit': 'fal-ai/kling-video/o3/standard/video-to-video/edit',
};

async function safeJson(res: Response): Promise<any> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    console.error('Failed to parse JSON, raw response:', text.substring(0, 500));
    throw new Error(`Non-JSON response (status ${res.status}): ${text.substring(0, 200)}`);
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { model = 'veo-3.1-fast', mode, userApiKey, ...params } = body;

    // Determine which FAL key to use
    let falKey: string;
    let shouldDeductCredits = false;
    let userId: string | null = null;

    if (userApiKey) {
      falKey = userApiKey;
    } else {
      const platformKey = Deno.env.get('FAL_KEY');
      if (!platformKey) {
        return new Response(JSON.stringify({ error: 'FAL_KEY not configured' }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      falKey = platformKey;
      shouldDeductCredits = true;

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_ANON_KEY") ?? ""
      );
      const authHeader = req.headers.get("Authorization");
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
      const { data: credits } = await adminClient
        .from("user_credits")
        .select("balance")
        .eq("user_id", userId)
        .single();

      if (!credits || credits.balance < VIDEO_COST) {
        return new Response(JSON.stringify({ error: 'Credito insufficiente' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Select endpoint based on model
    const endpoints = model === 'kling-2.5' ? KLING_ENDPOINTS : VEO_ENDPOINTS;
    const endpointId = endpoints[mode];
    if (!endpointId) {
      return new Response(JSON.stringify({ error: `Invalid mode "${mode}" for model "${model}". Valid modes: ${Object.keys(endpoints).join(', ')}` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (model === 'kling-2.5' && params.duration) {
      params.duration = params.duration.replace('s', '');
    }

    const queueUrl = `https://queue.fal.run/${endpointId}`;
    console.log('Submitting to:', queueUrl, 'model:', model, 'mode:', mode);

    const submitRes = await fetch(queueUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${falKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!submitRes.ok) {
      const err = await submitRes.text();
      console.error('fal.ai video submit error:', submitRes.status, err);
      return new Response(JSON.stringify({ error: `fal.ai error: ${err}` }), {
        status: submitRes.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const submitData = await safeJson(submitRes);
    const request_id = submitData.request_id;

    if (!request_id) {
      return new Response(JSON.stringify({ error: 'No request_id returned from fal.ai', details: submitData }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const responseUrl = submitData.response_url || `https://queue.fal.run/${endpointId}/requests/${request_id}`;
    const statusUrl = submitData.status_url || `${responseUrl}/status`;

    let attempts = 0;
    const maxAttempts = 300;

    while (attempts < maxAttempts) {
      const statusRes = await fetch(statusUrl, {
        headers: { 'Authorization': `Key ${falKey}` },
      });
      const statusData = await safeJson(statusRes);

      if (statusData.status === 'COMPLETED') {
        const resultRes = await fetch(responseUrl, {
          headers: { 'Authorization': `Key ${falKey}` },
        });
        const result = await safeJson(resultRes);

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
              .update({ balance: currentCredits.balance - VIDEO_COST, updated_at: new Date().toISOString() })
              .eq("user_id", userId);
          }
        }

        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (statusData.status === 'FAILED') {
        console.error('fal.ai video generation failed:', JSON.stringify(statusData));
        return new Response(JSON.stringify({ error: 'Video generation failed', details: statusData }), {
          status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await new Promise(r => setTimeout(r, 2000));
      attempts++;
    }

    return new Response(JSON.stringify({ error: 'Timeout waiting for video result' }), {
      status: 504, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ error: 'An unexpected error occurred' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
