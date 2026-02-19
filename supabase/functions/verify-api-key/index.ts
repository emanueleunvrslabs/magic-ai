import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData.user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

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
      const res = await fetch("https://queue.fal.run/fal-ai/fast-sdxl/status", {
        method: "GET",
        headers: { Authorization: `Key ${api_key}` },
      });
      if (res.status === 401 || res.status === 403) {
        errorMessage = "Invalid fal.ai API key";
      } else {
        valid = true;
      }
    } else if (provider === "openai") {
      const res = await fetch("https://api.openai.com/v1/models?limit=1", {
        headers: { Authorization: `Bearer ${api_key}` },
      });
      if (res.status === 401 || res.status === 403) {
        errorMessage = "Invalid OpenAI API key";
      } else if (res.ok) {
        valid = true;
      } else {
        errorMessage = `OpenAI verification failed: ${res.status}`;
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
      JSON.stringify({ error: "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
