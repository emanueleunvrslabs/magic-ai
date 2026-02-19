import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MODE_ENDPOINTS: Record<string, string> = {
  'text-to-video': 'fal-ai/veo3.1/fast',
  'extend-video': 'fal-ai/veo3.1/fast/extend-video',
  'first-last-frame': 'fal-ai/veo3.1/fast/first-last-frame-to-video',
  'image-to-video': 'fal-ai/veo3.1/fast/image-to-video',
  'reference-to-video': 'fal-ai/veo3.1/reference-to-video',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const FAL_KEY = Deno.env.get('FAL_KEY');
    if (!FAL_KEY) {
      return new Response(JSON.stringify({ error: 'FAL_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { mode, ...params } = body;

    const endpointId = MODE_ENDPOINTS[mode];
    if (!endpointId) {
      return new Response(JSON.stringify({ error: `Invalid mode: ${mode}. Valid modes: ${Object.keys(MODE_ENDPOINTS).join(', ')}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const queueUrl = `https://queue.fal.run/${endpointId}`;

    // Submit to queue
    const submitRes = await fetch(queueUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!submitRes.ok) {
      const err = await submitRes.text();
      console.error('fal.ai video submit error:', submitRes.status, err);
      return new Response(JSON.stringify({ error: `fal.ai error: ${err}` }), {
        status: submitRes.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { request_id } = await submitRes.json();

    // Poll for result (video generation can take longer)
    const baseUrl = `https://queue.fal.run/${endpointId}/requests/${request_id}`;
    let attempts = 0;
    const maxAttempts = 300; // 5 minutes max

    while (attempts < maxAttempts) {
      const statusRes = await fetch(`${baseUrl}/status`, {
        headers: { 'Authorization': `Key ${FAL_KEY}` },
      });
      const statusData = await statusRes.json();

      if (statusData.status === 'COMPLETED') {
        const resultRes = await fetch(baseUrl, {
          headers: { 'Authorization': `Key ${FAL_KEY}` },
        });
        const result = await resultRes.json();
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (statusData.status === 'FAILED') {
        console.error('fal.ai video generation failed:', JSON.stringify(statusData));
        return new Response(JSON.stringify({ error: 'Video generation failed', details: statusData }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await new Promise(r => setTimeout(r, 2000));
      attempts++;
    }

    return new Response(JSON.stringify({ error: 'Timeout waiting for video result' }), {
      status: 504,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Edge function error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
