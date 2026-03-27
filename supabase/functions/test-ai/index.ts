import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !claims?.user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, message, sessionId } = await req.json();

    switch (action) {
      case "test_chat": {
        // Test the AI chat functionality
        const testSessionId = sessionId || `test_${Date.now()}`;
        
        const chatResponse = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({
            message: message || "Olá, estou procurando um apartamento de 3 quartos no centro",
            sessionId: testSessionId,
            phone: null,
            platform: "test",
          }),
        });

        const chatResult = await chatResponse.json();
        
        return new Response(
          JSON.stringify({
            success: chatResponse.ok,
            sessionId: testSessionId,
            ...chatResult,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_stats": {
        // Get AI system statistics
        const [
          { count: totalConversations },
          { count: activeConversations },
          { count: qualifiedLeads },
          { count: totalProperties },
          { count: activeProperties },
          { count: pendingLearnings },
        ] = await Promise.all([
          supabase.from("ai_conversations").select("*", { count: "exact", head: true }),
          supabase.from("ai_conversations").select("*", { count: "exact", head: true }).eq("status", "active"),
          supabase.from("ai_conversations").select("*", { count: "exact", head: true }).eq("lead_qualified", true),
          supabase.from("imoveis").select("*", { count: "exact", head: true }),
          supabase.from("imoveis").select("*", { count: "exact", head: true }).eq("ativo", true),
          supabase.from("aprendizados_ia").select("*", { count: "exact", head: true }).eq("status", "pendente"),
        ]);

        return new Response(
          JSON.stringify({
            success: true,
            stats: {
              conversations: {
                total: totalConversations || 0,
                active: activeConversations || 0,
                qualifiedLeads: qualifiedLeads || 0,
              },
              properties: {
                total: totalProperties || 0,
                active: activeProperties || 0,
              },
              learnings: {
                pending: pendingLearnings || 0,
              },
            },
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_conversations": {
        // Get recent conversations
        const { data: conversations } = await supabase
          .from("ai_conversations")
          .select("id, session_id, phone, platform, lead_qualified, qualification_score, status, created_at, updated_at")
          .order("updated_at", { ascending: false })
          .limit(20);

        return new Response(
          JSON.stringify({
            success: true,
            conversations: conversations || [],
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_conversation_detail": {
        // Get specific conversation details
        const { data: conversation } = await supabase
          .from("ai_conversations")
          .select("*")
          .eq("id", sessionId)
          .single();

        return new Response(
          JSON.stringify({
            success: !!conversation,
            conversation,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "get_learnings": {
        // Get pending learnings for review
        const { data: learnings } = await supabase
          .from("aprendizados_ia")
          .select("*")
          .eq("status", "pendente")
          .order("frequencia", { ascending: false })
          .limit(20);

        return new Response(
          JSON.stringify({
            success: true,
            learnings: learnings || [],
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "approve_learning": {
        // Approve a learning
        const { error } = await supabase
          .from("aprendizados_ia")
          .update({ 
            status: "aprovado", 
            aprovado_por: claims.user.id,
            updated_at: new Date().toISOString()
          })
          .eq("id", sessionId);

        return new Response(
          JSON.stringify({ success: !error }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "reject_learning": {
        // Reject a learning
        const { error } = await supabase
          .from("aprendizados_ia")
          .update({ 
            status: "rejeitado",
            aprovado_por: claims.user.id,
            updated_at: new Date().toISOString()
          })
          .eq("id", sessionId);

        return new Response(
          JSON.stringify({ success: !error }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      case "sync_properties": {
        // Trigger property feed sync
        const syncResponse = await fetch(`${SUPABASE_URL}/functions/v1/sync-feed`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          },
        });

        const syncResult = await syncResponse.json();

        return new Response(
          JSON.stringify(syncResult),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ 
            error: "Unknown action",
            availableActions: [
              "test_chat",
              "get_stats",
              "get_conversations",
              "get_conversation_detail",
              "get_learnings",
              "approve_learning",
              "reject_learning",
              "sync_properties"
            ]
          }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
  } catch (error) {
    console.error("[test-ai] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
