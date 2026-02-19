import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { provider, api_key } = await req.json();

    if (!provider || !api_key) {
      return new Response(
        JSON.stringify({ error: "Missing provider or api_key" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let valid = false;
    let errorMessage = "";

    if (provider === "fal") {
      // Verify fal.ai key by calling a lightweight endpoint
      const res = await fetch("https://queue.fal.run/fal-ai/fast-sdxl/status", {
        method: "GET",
        headers: { Authorization: `Key ${api_key}` },
      });
      // A 401/403 means invalid key, other errors might be OK (e.g. 404 no queue)
      if (res.status === 401 || res.status === 403) {
        errorMessage = "Invalid fal.ai API key";
      } else {
        valid = true;
      }
    } else if (provider === "openai") {
      // Verify OpenAI key by listing models
      const res = await fetch("https://api.openai.com/v1/models?limit=1", {
        headers: { Authorization: `Bearer ${api_key}` },
      });
      if (res.status === 401 || res.status === 403) {
        errorMessage = "Invalid OpenAI API key";
      } else if (res.ok) {
        valid = true;
      } else {
        const body = await res.text();
        errorMessage = `OpenAI verification failed: ${res.status}`;
        console.error("OpenAI verify error:", body);
      }
    } else {
      return new Response(
        JSON.stringify({ error: "Unknown provider" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ valid, error: errorMessage || undefined }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("verify-api-key error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
