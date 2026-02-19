import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const CREDIT_PACKAGES: Record<string, { priceId: string; credits: number }> = {
  "10": { priceId: "price_1T2aE5AX7XT7O7omUAwCSy22", credits: 10 },
  "20": { priceId: "price_1T2aEKAX7XT7O7omDwHFxbP9", credits: 20 },
  "50": { priceId: "price_1T2aEXAX7XT7O7omyp0Og56o", credits: 50 },
  "100": { priceId: "price_1T2aErAX7XT7O7omxTQ9r9Xp", credits: 100 },
  "250": { priceId: "price_1T2aF3AX7XT7O7ompAE95i2M", credits: 250 },
  "500": { priceId: "price_1T2aFGAX7XT7O7omYm0lZJtA", credits: 500 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? ""
  );

  try {
    const authHeader = req.headers.get("Authorization");
    console.log("Auth header present:", !!authHeader);
    if (!authHeader) throw new Error("Not authenticated – no authorization header");
    const token = authHeader.replace("Bearer ", "");
    const { data, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError) {
      console.error("Auth error:", authError.message);
      throw new Error("Auth error: " + authError.message);
    }
    const user = data.user;
    if (!user) throw new Error("Not authenticated");

    const { package: pkg } = await req.json();
    console.log("Package requested:", pkg);
    const selected = CREDIT_PACKAGES[pkg];
    if (!selected) throw new Error("Invalid package: " + pkg);

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");
    if (stripeKey.startsWith("pk_")) throw new Error("Invalid key: using publishable key instead of secret key");
    console.log("Stripe key mode:", stripeKey.startsWith("sk_test_") ? "test" : "live");
    const stripe = new Stripe(stripeKey, {
      apiVersion: "2025-08-27.basil",
    });

    const email =
      user.email && !user.email.includes("@magic-ai.app")
        ? user.email
        : undefined;

    // Check existing customer
    let customerId: string | undefined;
    if (email) {
      const customers = await stripe.customers.list({ email, limit: 1 });
      if (customers.data.length > 0) customerId = customers.data[0].id;
    }

    console.log("Creating checkout session for user:", user.id, "email:", email, "customerId:", customerId);
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : email,
      line_items: [{ price: selected.priceId, quantity: 1 }],
      mode: "payment",
      success_url: `${req.headers.get("origin")}/?payment=success&credits=${selected.credits}`,
      cancel_url: `${req.headers.get("origin")}/`,
      metadata: {
        user_id: user.id,
        credits: selected.credits.toString(),
      },
    });

    console.log("Checkout session created:", session.id, "url:", session.url);
    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
