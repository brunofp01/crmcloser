import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Get caller from auth header
    const authHeader = req.headers.get("authorization");
    const { email, password, full_name, whatsapp, role, manager_id, setupToken } = await req.json();

    let callerRole: string | null = null;
    let callerId: string | null = null;

    // Support legacy setup token flow
    if (setupToken) {
      const expectedToken = Deno.env.get("SETUP_ADMIN_TOKEN");
      if (!expectedToken || setupToken !== expectedToken) {
        return new Response(
          JSON.stringify({ error: "Unauthorized - Invalid setup token" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      callerRole = "master";
    } else if (authHeader) {
      // Verify caller identity
      const token = authHeader.replace("Bearer ", "");
      const { data: { user: caller }, error: authError } = await supabaseAdmin.auth.getUser(token);
      if (authError || !caller) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      callerId = caller.id;

      // Check caller role
      const isMaster = caller.email === "brunofp01@gmail.com";
      if (isMaster) {
        callerRole = "master";
      } else {
        const { data: roleData } = await supabaseAdmin
          .from("user_roles")
          .select("role")
          .eq("user_id", caller.id)
          .maybeSingle();
        callerRole = roleData?.role || "corretor";
      }
    } else {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate permissions
    if (callerRole === "corretor") {
      return new Response(
        JSON.stringify({ error: "Corretores não podem criar usuários" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const newRole = role || "corretor";

    // Gerente can only create corretores
    if (callerRole === "gerente") {
      if (newRole !== "corretor") {
        return new Response(
          JSON.stringify({ error: "Gerentes só podem criar corretores" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Create user
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name || email },
    });

    if (createError) {
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const newUserId = userData.user?.id;
    if (!newUserId) {
      return new Response(
        JSON.stringify({ error: "Usuário não criado" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update profile with whatsapp and manager_id
    const profileUpdate: Record<string, any> = {};
    if (whatsapp) profileUpdate.whatsapp = whatsapp;
    
    // For gerente creating a corretor, auto-assign themselves as manager
    if (callerRole === "gerente" && callerId) {
      profileUpdate.manager_id = callerId;
    } else if (manager_id) {
      profileUpdate.manager_id = manager_id;
    }

    if (Object.keys(profileUpdate).length > 0) {
      await supabaseAdmin
        .from("profiles")
        .update(profileUpdate)
        .eq("user_id", newUserId);
    }

    // Set user role (the trigger sets default, but we may need to override)
    if (newRole !== "corretor") {
      // Delete default role set by trigger and insert correct one
      await supabaseAdmin
        .from("user_roles")
        .delete()
        .eq("user_id", newUserId);

      await supabaseAdmin
        .from("user_roles")
        .insert({ user_id: newUserId, role: newRole });
    }

    return new Response(
      JSON.stringify({ success: true, userId: newUserId }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
