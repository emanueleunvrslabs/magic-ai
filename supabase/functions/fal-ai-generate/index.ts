import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Determine endpoint based on mode
    const endpoint = mode === 'edit'
      ? 'https://queue.fal.run/fal-ai/nano-banana-pro/edit'
      : 'https://queue.fal.run/fal-ai/nano-banana-pro';

    // Submit to queue
    const submitRes = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Key ${FAL_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!submitRes.ok) {
      const err = await submitRes.text();
      return new Response(JSON.stringify({ error: `fal.ai error: ${err}` }), {
        status: submitRes.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { request_id, status: queueStatus } = await submitRes.json();

    // Poll for result
    const resultUrl = mode === 'edit'
      ? `https://queue.fal.run/fal-ai/nano-banana-pro/edit/requests/${request_id}`
      : `https://queue.fal.run/fal-ai/nano-banana-pro/requests/${request_id}`;

    let attempts = 0;
    const maxAttempts = 60; // 60 seconds max

    while (attempts < maxAttempts) {
      const statusRes = await fetch(`${resultUrl}/status`, {
        headers: { 'Authorization': `Key ${FAL_KEY}` },
      });
      const statusData = await statusRes.json();

      if (statusData.status === 'COMPLETED') {
        const resultRes = await fetch(resultUrl, {
          headers: { 'Authorization': `Key ${FAL_KEY}` },
        });
        const result = await resultRes.json();
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      if (statusData.status === 'FAILED') {
        return new Response(JSON.stringify({ error: 'Generation failed', details: statusData }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      await new Promise(r => setTimeout(r, 1000));
      attempts++;
    }

    return new Response(JSON.stringify({ error: 'Timeout waiting for result' }), {
      status: 504,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
