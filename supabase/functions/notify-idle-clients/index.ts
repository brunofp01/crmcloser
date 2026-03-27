import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all active clients (not closed/lost/quarantine) with their latest interaction
    const { data: clients, error: clientsError } = await supabase
      .from("clients")
      .select("id, name, phone, stage, created_by, assigned_to")
      .not("stage", "in", '("closed","lost","quarantine")');

    if (clientsError) throw clientsError;

    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    const threshold = threeDaysAgo.toISOString();

    let notificationsCreated = 0;

    for (const client of clients || []) {
      // Check latest interaction
      const { data: interactions } = await supabase
        .from("client_interactions")
        .select("created_at")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false })
        .limit(1);

      const lastInteraction = interactions?.[0]?.created_at;
      const isIdle = !lastInteraction || lastInteraction < threshold;

      if (!isIdle) continue;

      // Determine who to notify (assigned_to or created_by)
      const targetUserId = client.assigned_to || client.created_by;

      // Check if we already sent this notification today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("user_id", targetUserId)
        .eq("type", "client")
        .eq("related_id", client.id)
        .gte("created_at", today.toISOString())
        .limit(1);

      if (existing && existing.length > 0) continue;

      const daysSince = lastInteraction
        ? Math.floor(
            (Date.now() - new Date(lastInteraction).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        : Math.floor(
            (Date.now() - new Date(client.created_at || Date.now()).getTime()) /
              (1000 * 60 * 60 * 24)
          );

      // Create notification
      const { error: notifError } = await supabase
        .from("notifications")
        .insert({
          user_id: targetUserId,
          title: "Cliente sem atendimento",
          message: `${client.name} está sem atendimento há ${daysSince} dias. Entre em contato!`,
          type: "client",
          related_id: client.id,
        });

      if (!notifError) notificationsCreated++;
    }

    // Also try to send push notifications to subscribed users
    if (notificationsCreated > 0) {
      const { data: subscriptions } = await supabase
        .from("push_subscriptions")
        .select("user_id, subscription");

      // Group notifications by user for push
      for (const sub of subscriptions || []) {
        try {
          const subData = typeof sub.subscription === 'string' 
            ? JSON.parse(sub.subscription) 
            : sub.subscription;
          
          // Send web push notification
          // Note: Web Push requires VAPID keys and web-push library
          // For now, in-app notifications are created above
          console.log(`Push subscription found for user ${sub.user_id}`);
        } catch (e) {
          console.error("Error processing push subscription:", e);
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        notifications_created: notificationsCreated,
        clients_checked: clients?.length || 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
