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
    console.log('Submitting to:', queueUrl, 'mode:', mode, 'params:', JSON.stringify(params));

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

    const submitData = await safeJson(submitRes);
    console.log('Submit response:', JSON.stringify(submitData));
    const request_id = submitData.request_id;

    if (!request_id) {
      console.error('No request_id in submit response:', JSON.stringify(submitData));
      return new Response(JSON.stringify({ error: 'No request_id returned from fal.ai', details: submitData }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Use URLs from submit response if available, otherwise construct them
    const responseUrl = submitData.response_url || `https://queue.fal.run/${endpointId}/requests/${request_id}`;
    const statusUrl = submitData.status_url || `${responseUrl}/status`;
    console.log('Polling status at:', statusUrl);
    console.log('Will fetch result from:', responseUrl);

    let attempts = 0;
    const maxAttempts = 300;

    while (attempts < maxAttempts) {
      const statusRes = await fetch(statusUrl, {
        headers: { 'Authorization': `Key ${FAL_KEY}` },
      });
      const statusData = await safeJson(statusRes);

      if (statusData.status === 'COMPLETED') {
        const resultRes = await fetch(responseUrl, {
          headers: { 'Authorization': `Key ${FAL_KEY}` },
        });
        const result = await safeJson(resultRes);
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