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
    const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
    const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");
    const EVOLUTION_INSTANCE = Deno.env.get("EVOLUTION_INSTANCE");

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse webhook payload from Evolution API
    const payload = await req.json();
    console.log("[webhook-evolution] Received webhook:", JSON.stringify(payload).slice(0, 500));

    // Evolution API webhook structure
    const { event, data, instance } = payload;

    // Handle different event types
    if (event === "messages.upsert" && data?.message) {
      const messageData = data.message;
      const remoteJid = messageData.key?.remoteJid;
      const fromMe = messageData.key?.fromMe;
      const messageText = messageData.message?.conversation || 
                          messageData.message?.extendedTextMessage?.text ||
                          messageData.message?.imageMessage?.caption ||
                          "";

      // Only process incoming messages (not sent by us)
      if (fromMe || !messageText) {
        console.log("[webhook-evolution] Ignoring message (fromMe or empty)");
        return new Response(JSON.stringify({ success: true, ignored: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Extract phone number from remoteJid
      const phone = remoteJid?.replace("@s.whatsapp.net", "").replace("@g.us", "") || "";
      const isGroup = remoteJid?.includes("@g.us");

      // Skip group messages for now
      if (isGroup) {
        console.log("[webhook-evolution] Ignoring group message");
        return new Response(JSON.stringify({ success: true, ignored: true, reason: "group" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Generate session ID from phone
      const sessionId = `whatsapp_${phone}`;

      // Call ai-chat function to process the message
      const aiChatResponse = await fetch(`${SUPABASE_URL}/functions/v1/ai-chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
        body: JSON.stringify({
          message: messageText,
          sessionId,
          phone,
          platform: "whatsapp",
        }),
      });

      if (!aiChatResponse.ok) {
        const errorText = await aiChatResponse.text();
        console.error("[webhook-evolution] AI chat error:", errorText);
        throw new Error("AI chat processing failed");
      }

      const aiResult = await aiChatResponse.json();
      const replyMessage = aiResult.message;

      // Send reply via Evolution API if configured
      if (EVOLUTION_API_URL && EVOLUTION_API_KEY && EVOLUTION_INSTANCE && replyMessage) {
        try {
          const sendResponse = await fetch(
            `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE}`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                apikey: EVOLUTION_API_KEY,
              },
              body: JSON.stringify({
                number: phone,
                text: replyMessage,
              }),
            }
          );

          if (!sendResponse.ok) {
            const sendError = await sendResponse.text();
            console.error("[webhook-evolution] Failed to send reply:", sendError);
          } else {
            console.log("[webhook-evolution] Reply sent successfully to", phone);
          }
        } catch (sendError) {
          console.error("[webhook-evolution] Error sending reply:", sendError);
        }
      } else {
        console.log("[webhook-evolution] Evolution API not configured, skipping reply");
      }

      // Check if we should create a client for this lead
      if (aiResult.qualificationScore >= 60) {
        // Check if client exists
        const { data: existingClient } = await supabase
          .from("clients")
          .select("id, name")
          .eq("phone", phone)
          .single();

        if (!existingClient) {
          // Create new lead
          const { error: createError } = await supabase.from("clients").insert({
            name: `Lead WhatsApp ${phone}`,
            phone,
            stage: "lead",
            priority: aiResult.qualificationScore >= 80 ? "high" : "medium",
            source: "WhatsApp - Evolution API",
            notes: `Qualificação automática: ${aiResult.qualificationScore}/100\nInteresses: ${JSON.stringify(aiResult.extractedInterests)}`,
            created_by: "00000000-0000-0000-0000-000000000000",
          });

          if (createError) {
            console.error("[webhook-evolution] Error creating client:", createError);
          } else {
            console.log("[webhook-evolution] Created new lead for", phone);

            // Create notification for master user
            await supabase.from("notifications").insert({
              user_id: "00000000-0000-0000-0000-000000000000", // Will need proper user ID
              title: "Novo lead qualificado via WhatsApp",
              message: `Telefone: ${phone}\nScore: ${aiResult.qualificationScore}/100`,
              type: "lead",
            });
          }
        } else {
          // Update existing client with new interaction
          await supabase.from("client_interactions").insert({
            client_id: existingClient.id,
            type: "whatsapp",
            notes: `Mensagem recebida: ${messageText.slice(0, 200)}`,
            created_by: "00000000-0000-0000-0000-000000000000",
          });
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          sessionId,
          qualificationScore: aiResult.qualificationScore,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle connection status events
    if (event === "connection.update") {
      console.log("[webhook-evolution] Connection update:", data?.state);
      return new Response(
        JSON.stringify({ success: true, event: "connection.update", state: data?.state }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle QR code events
    if (event === "qrcode.updated") {
      console.log("[webhook-evolution] QR Code updated");
      return new Response(
        JSON.stringify({ success: true, event: "qrcode.updated" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Default response for unhandled events
    return new Response(
      JSON.stringify({ success: true, event: event || "unknown" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("[webhook-evolution] Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
