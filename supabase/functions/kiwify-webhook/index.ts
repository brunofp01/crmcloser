import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const body = await req.json();
    console.log("Kiwify Webhook received:", body);

    const { order_status, customer, order_id } = body;
    const email = customer?.email;

    if (!email) {
      return new Response(JSON.stringify({ error: "No email provided" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Logic for activation
    // Kiwify statuses: paid, approved, active are considered "success"
    const isSuccess = ["paid", "approved", "active"].includes(order_status?.toLowerCase());

    if (isSuccess) {
      console.log(`Activating account for ${email}...`);

      // 1. Find the user profile by email
      const { data: profile, error: profileError } = await supabaseClient
        .from("profiles")
        .select("user_id")
        .eq("email", email)
        .maybeSingle();

      if (profileError || !profile) {
        console.error("Profile not found for email:", email);
        return new Response(JSON.stringify({ error: "Profile not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // 2. Update Role to 'corretor' in user_roles
      const { error: roleError } = await supabaseClient
        .from("user_roles")
        .upsert({ user_id: profile.user_id, role: "corretor" }, { onConflict: "user_id" });

      if (roleError) console.error("Error updating role:", roleError);

      // 3. Update Profile status and order info
      const { error: updateError } = await supabaseClient
        .from("profiles")
        .update({
          subscription_status: "active",
          kiwify_order_id: order_id,
          kiwify_payload: body,
          updated_at: new Date().toISOString(),
        })
        .eq("user_id", profile.user_id);

      if (updateError) console.error("Error updating profile:", updateError);

      console.log(`Successfully activated user ${profile.user_id}`);
    } else {
      console.log(`Order status is ${order_status}, no action taken.`);
      
      // If payment fails or is canceled, we might want to update status to 'pending' or 'canceled'
      const { data: profile } = await supabaseClient
        .from("profiles")
        .select("user_id")
        .eq("email", email)
        .maybeSingle();

      if (profile) {
        await supabaseClient
          .from("profiles")
          .update({
            subscription_status: order_status,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", profile.user_id);
      }
    }

    return new Response(JSON.stringify({ message: "Webhook processed" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Webhook processing error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
